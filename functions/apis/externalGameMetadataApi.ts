export async function fetchGameDetail(host: string, launchCode: string) {
    const res = await fetch(`${host}/api/games/details/${launchCode}`, {
        headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) {
        const error = await res.json();
        const errMessage = `Game Details Source API : ${res.status}-${error.message}`;
        console.error(errMessage);

        throw new Error(errMessage);
    };
    return res.json();
};

export async function fetchGamesList(host: string, queryString: string) {
    const res = await fetch(`${host}/api/games?${queryString}`, {
        headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) {
        const error = await res.json();
        const errMessage = `Game List Source API : ${res.status}-${error.message}`;
        console.error(errMessage);

        throw new Error(errMessage);
    };
    return res.json();
};
