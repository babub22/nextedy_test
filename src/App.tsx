import React, { useEffect, useState, useMemo } from 'react';

type Stock = {
    price: number,
    time: string
}

type StockTable = { [key: string]: Stock };

function App() {
    const [query, setQuery] = useState<string>("");
    const [debouncedQuery, setDebouncedQuery] = useState<string>(query);
    const [queryWasChangedDuringLoading, setQueryWasChangedDuringLoading] = useState<boolean>(false);
    const { result: stocks, loading, error } = useFetchStocks();

    useEffect(() => {
        setQuery(localStorage.getItem("prevQuery") || "");
    }, []);

    useEffect(() => {
        if (!loading) setQueryWasChangedDuringLoading(false);
    }, [loading]);

    const selectedStocks = useMemo(() => {
        if (loading) {
            if (queryWasChangedDuringLoading) {
                return null;
            }

            const storeSearchResults = localStorage.getItem("prevSearchRes");
            if (storeSearchResults) {
                return JSON.parse(storeSearchResults);
            }
        }

        if (debouncedQuery) {
            let searchRes: StockTable = {};
            let atleastOne = false;

            debouncedQuery.split(",").forEach(subQuery => {
                subQuery = subQuery.trim().toUpperCase();

                if (stocks[subQuery]) {
                    atleastOne = true;
                    searchRes[subQuery] = stocks[subQuery];
                }
            })

            if (atleastOne) {
                localStorage.setItem("prevSearchRes", JSON.stringify(searchRes));
                return searchRes;
            } else {
                localStorage.removeItem("prevSearchRes");
                return null;
            }
        } else {
            localStorage.removeItem("prevSearchRes");
            return null;
        }
    }, [debouncedQuery, loading]);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedQuery(query);
            localStorage.setItem("prevQuery", query);
        }, 50);

        return () => {
            clearTimeout(handler);
        };
    }, [query]);

    return (
        <div className="App">
            <input autoFocus value={query} onChange={(e) => {
                if (loading) {
                    setQueryWasChangedDuringLoading(true);
                }
                setQuery(e.target.value);
            }} />

            {(loading && !selectedStocks) ? (
                <div>Loading...</div>
            ) : (
                <StocksInfo selectedStocks={selectedStocks ? selectedStocks : stocks} />
            )}
        </div>
    );
}

function StocksInfo({ selectedStocks }: { selectedStocks: StockTable }) {
    return (<>
        {Object.keys(selectedStocks).map((key, i) => <div key={i} style={{ display: 'flex' }}>
            <span style={{ marginRight: '25px' }}>{key}</span>
            <span style={{ marginRight: '25px' }}>{selectedStocks[key].price}</span>
            <span>{selectedStocks[key].time}</span>
        </div>)
        }

    </>);
}

function useFetchStocks() {
    const [result, setResult] = useState<StockTable>({});
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        async function fetchStockList() {
            while (true) {
                try {
                    const response = await new Promise(resolve => setTimeout(() => resolve(genMockStocks()), 10000)) as StockTable;

                    setResult(response);
                    setLoading(false);
                } catch (err) {
                    if (err instanceof Error) {
                        setError(err);
                    }

                    setLoading(false);

                    break;
                }

                console.log("fetched")
            }
        }

        fetchStockList();
    }, []);

    return { result, loading, error };
}

const stockNames = [
    "PFE", "AMZN", "ADBE", "IBM", "MA", "T", "HD", "WMT", "GS", "PEP",
    "TXN", "META", "NFLX", "V", "COST", "AAPL", "MSFT", "UNH", "NVDA", "LOW",
    "NKE", "HON", "BRK.A", "JPM", "BAC", "AMD", "UPS", "ORCL", "PG", "CAT",
    "TSLA", "GE", "GOOGL", "DIS", "SBUX", "INTC", "MS", "CRM", "XOM", "CVX",
    "PYPL", "QCOM", "JNJ", "CSCO", "MDT", "LLY", "KO", "ABBV", "DHR"
]

function genMockStocks() {
    let resStocks: StockTable = {};

    stockNames.forEach(stock => {
        resStocks[stock] = {} as Stock;
        resStocks[stock].price = Math.floor(Math.random() * (1000)) + 10 - Math.random();
        resStocks[stock].price = Number(resStocks[stock].price.toFixed(2));

        resStocks[stock].time = new Date().toString().replace(/ GMT.+/, "");
    })

    return resStocks;
}

export default App;
