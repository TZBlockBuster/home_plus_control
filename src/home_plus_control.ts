import {AccessoryPlugin, API, HAP, Logging, PlatformConfig, StaticPlatformPlugin,} from "homebridge";
import {LightSwitch} from "./LightSwitch";
import {DimmableLightSwitch} from "./DimmableLightSwitch";
import {Netatmo} from "netatmo";

const PLATFORM_NAME = "homebridge-home_plus_control";
const PLUGIN_NAME = "homebridge-home_plus_control";

let hap: HAP;

export = (api: API) => {
    hap = api.hap;

    api.registerPlatform(PLATFORM_NAME, HomePlusControlPlatform);
};

class HomePlusControlPlatform implements StaticPlatformPlugin {


    private readonly log: Logging;

    public static Accessory = {
        "a24a7f-2b10-f0592c453f2c": "Bett Rechts",
        "a24a7f-2c10-f0592c432712": "Bett Links"
    }


    public static Accessories: string[] = []


    public static AccessoryName: { [key: string]: string } = {};

    public static LightSwitchState: { [key: string]: boolean } = {};

    private home_id: string = "";
    private token: string = "";

    constructor(log: Logging, config: PlatformConfig, api: API) {
        this.log = log;

        // probably parse config or something here

        log.info("Home + Control Platform Plugin Loading...");

        this.home_id = config["home_id"];
        this.token = config["token"];

        // get json using a http request
        this.loadAccessories();

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
        fetch('https://api.netatmo.com/api/homesdata', {
            method: 'GET',
            headers: {
                'accept': 'application/json',
                'Authorization': 'Bearer ' + this.token
            }
        }).then(response => {
            this.log.info("Got response using token " + this.token);
            const json = response.json();
            this.log.info("Got json: " + JSON.stringify(json));
            return json;
        })
            .then(data => {
                if (data["error"] != null) {
                    this.log.error("Error: " + data["error"]["message"]);
                } else if(data["body"]["homes"] != null) {
                    data["body"]["homes"].forEach((home: any) => {
                        home["modules"].forEach((module: any) => {
                            if (module["type"] === "BNLD") {
                                HomePlusControlPlatform.Accessories.push(module["id"])
                                HomePlusControlPlatform.AccessoryName[module["id"]] = module["name"]
                            }
                        });
                    });
                } else {
                    this.log.error("Error: No homes found");
                }
            });
    }

    accessories(callback: (foundAccessories: AccessoryPlugin[]) => void): void {
        var foundAccessories: AccessoryPlugin[] = [];
        for (const id of HomePlusControlPlatform.Accessories) {
            this.log.info("Adding accessory with id " + id);
            foundAccessories.push(new LightSwitch(hap, this.log, HomePlusControlPlatform.AccessoryName[id], id));
        }
        callback(foundAccessories);
        /*callback([
            new LightSwitch(hap, this.log, "Bett Rechts", "a24a7f-2b10-f0592c453f2c"),
            new LightSwitch(hap, this.log, "Bett Links", "a24a7f-2c10-f0592c432712"),
            new DimmableLightSwitch(hap, this.log, "Wand", "a24a7f-0c10-f0592c1a45ba")
        ]);*/
    }
}