import {AccessoryPlugin, API, HAP, Logging, PlatformConfig, StaticPlatformPlugin,} from "homebridge";
import {LightSwitch} from "./LightSwitch";
import {DimmableLightSwitch} from "./DimmableLightSwitch";

const PLATFORM_NAME = "homebridge-home_plus_control";
const PLUGIN_NAME = "homebridge-home_plus_control";

let hap: HAP;

export = (api: API) => {
    hap = api.hap;

    api.registerPlatform(PLATFORM_NAME, HomePlusControlPlatform);
};

class HomePlusControlPlatform implements StaticPlatformPlugin {


    private readonly log: Logging;


    public static Accessories: string[] = []


    public static AccessoryName: { [key: string]: string } = {};
    public static AccessoryBridge: { [key: string]: string } = {};

    public static LightSwitchState: { [key: string]: boolean } = {};

    private home_id: string = "";
    private token: string = "";

    constructor(log: Logging, config: PlatformConfig, api: API) {
        this.log = log;

        // probably parse config or something here

        log.info("Home + Control Platform Plugin Loading...");


        this.home_id = config["home_id"];
        this.token = config["token"];


        try {
            this.loadAccessories();
        } catch (e) {
            this.log.error("Error loading accessories: " + e);
        }

        // get json using a http request

        log.info("Example platform finished initializing!");
    }

    reloadAccessories(): void {
        this.log.info(this.home_id)
        fetch('https://api.netatmo.com/api/homestatus?home_id=' + this.home_id, {
            method: 'GET',
            headers: {
                'accept': 'application/json',
                'Authorization': 'Bearer ' + this.token
            }
        }).then(response => response.json())
            .then(data => {
                this.log.info("Got data: " + JSON.stringify(data));
                if (data["error"] != null) {
                    this.log.error("Error: " + data["error"]["message"]);
                } else {
                    data["body"]["home"]["modules"].forEach((module: any) => {
                        if (module["type"] === "BNLD") {
                            HomePlusControlPlatform.Accessories.push(module["id"])
                        }
                    });
                }
            });
    }

    loadAccessories(): void {
        this.log.info("Loading accessories...");
        this.loadAsyncAccessories().then(() => {
            this.log.info("Loaded accessories: " + HomePlusControlPlatform.Accessories);
        });
    }

    async loadAsyncAccessories() {
        const response = await fetch('https://api.netatmo.com/api/homesdata', {
            method: 'GET',
            headers: {
                'accept': 'application/json',
                'Authorization': 'Bearer ' + this.token
            }
        })
        const data = await response.json()
        this.log.info("Got data: " + JSON.stringify(data));
        if (data["error"] != null) {
            this.log.error("Error: " + data["error"]["message"]);
        } else if (data["body"]["homes"] != null) {
            data["body"]["homes"].forEach((home: any) => {
                if (home["modules"] != null) {
                    home["modules"].forEach((module: any) => {
                        if (module["type"] === "BNLD") {
                            HomePlusControlPlatform.Accessories.push(module["id"])
                            HomePlusControlPlatform.AccessoryName[module["id"]] = module["name"]
                            HomePlusControlPlatform.AccessoryBridge[module["id"]] = module["bridge"]
                        }
                    });
                } else {
                    this.log.error("No modules found for home " + home["name"])
                }
            });
        }
    }

    accessories(callback: (foundAccessories: AccessoryPlugin[]) => void): void {
        const foundAccessories: AccessoryPlugin[] = [];
        for (const id of HomePlusControlPlatform.Accessories) {
            this.log.info("Adding accessory with id " + id);
            foundAccessories.push(new LightSwitch(hap, this.log, HomePlusControlPlatform.AccessoryName[id], id, this.home_id, HomePlusControlPlatform.AccessoryBridge[id], this.token));
        }
        callback(foundAccessories);
        /*callback([
            new LightSwitch(hap, this.log, "Bett Rechts", "a24a7f-2b10-f0592c453f2c", this.home_id, "00:03:50:a2:4a:7f", this.token),
            new LightSwitch(hap, this.log, "Bett Links", "a24a7f-2c10-f0592c432712", this.home_id, "00:03:50:a2:4a:7f", this.token),
            new DimmableLightSwitch(hap, this.log, "Wand", "a24a7f-0c10-f0592c1a45ba", this.home_id, "00:03:50:a2:4a:7f", this.token)
        ]);*/
    }
}