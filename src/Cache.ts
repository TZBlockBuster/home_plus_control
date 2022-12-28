

class HomePlusControlCache {

    public static forceUpdate: boolean = false;

    private static result: any

    private static lastUpdate: Date = new Date();

     static async getHomeStatus(home_id: string, token: string): Promise<any> {
        if (HomePlusControlCache.result == null || HomePlusControlCache.forceUpdate || (new Date().getTime() - HomePlusControlCache.lastUpdate.getTime()) > 10000) {
            const request = fetch("https://api.netatmo.com/api/homestatus?home_id=" + home_id, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                }
            });
            const response = await request;
            const data = await response.json();
            HomePlusControlCache.result = data;
            HomePlusControlCache.forceUpdate = false;
            HomePlusControlCache.lastUpdate = new Date();
            return data;
        } else {
            return HomePlusControlCache.result;
        }
    }

}