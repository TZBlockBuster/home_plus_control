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

    public static Accessory: { [key: string]: string } = {
        "a24a7f-2b10-f0592c453f2c": "Bett Rechts",
        "a24a7f-2c10-f0592c432712": "Bett Links"
    }


    public static Accessories: string[] = []


    public static AccessoryName: { [key: string]: string } = {};

    private home_id: string = "";
    private token: string = "";

    constructor(log: Logging, config: PlatformConfig, api: API) {
        this.log = log;

        // probably parse config or something here

        log.info("Home + Control Platform Plugin Loading...");

        this.home_id = config["home_id"];
        this.token = config["token"];
        HomePlusControlPlatform.Accessory = config["accessories"];

        for (const id in HomePlusControlPlatform.Accessory) {
            HomePlusControlPlatform.Accessories.push(id);
        }

        this.loadAccessories();

        // get json using a http request

        log.info("Example platform finished initializing!");
    }

    loadAccessories(): void {
        this.log.info("Loading accessories...");
        this.loadAsyncAccessories().then(() => {
            this.log.info("Loaded accessories: " + HomePlusControlPlatform.Accessories);
        });
    }

    async loadAsyncAccessories() {
        const response = await fetch('https://api.netatmo.com/api/homestatus?home_id=' + this.home_id, {
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
                            HomePlusControlPlatform.AccessoryName[module["id"]] = module["name"]
                            DimmableLightSwitch.LightBrightnessState[module["id"]] = module["brightness"]
                            DimmableLightSwitch.LightSwitchState[module["id"]] = module["on"]
                        }
                    });
                } else {
                    this.log.error("No modules found for home " + home["name"])
                }
            });
        }
    }

    accessories(callback: (foundAccessories: AccessoryPlugin[]) => void): void {
        var foundAccessories: AccessoryPlugin[] = [];
        for (const id of HomePlusControlPlatform.Accessories) {
            this.log.info("Adding accessory with id " + id);
            foundAccessories.push(new DimmableLightSwitch(hap, this.log, HomePlusControlPlatform.Accessory[id], id, this.home_id, "00:03:50:a2:4a:7f", this.token));
        }
        callback(foundAccessories);
        /*callback([
            new LightSwitch(hap, this.log, "Bett Rechts", "a24a7f-2b10-f0592c453f2c", this.home_id, "00:03:50:a2:4a:7f", this.token),
            new LightSwitch(hap, this.log, "Bett Links", "a24a7f-2c10-f0592c432712", this.home_id, "00:03:50:a2:4a:7f", this.token),
            new DimmableLightSwitch(hap, this.log, "Wand", "a24a7f-0c10-f0592c1a45ba", this.home_id, "00:03:50:a2:4a:7f", this.token)
        ]);*/
    }
}