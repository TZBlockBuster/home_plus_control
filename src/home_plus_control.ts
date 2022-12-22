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

    public static Accessory = {
        "a24a7f-2b10-f0592c453f2c": "Bett Rechts",
        "a24a7f-2c10-f0592c432712": "Bett Links"
    }

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
        this.reloadAccessories()

        log.info("Example platform finished initializing!");
    }

    reloadAccessories(): void {
        fetch('https://api.netatmo.com/api/homestatus?home_id=' + this.home_id + "&device_types=BNLD", {
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
                        if (module["type"] === "BNIL") {
                            HomePlusControlPlatform.LightSwitchState[module["id"]] = module["on"];
                        }
                    });
                }
            });
    }

    accessories(callback: (foundAccessories: AccessoryPlugin[]) => void): void {
    callback([
      new LightSwitch(hap, this.log, "Bett Rechts", "a24a7f-2b10-f0592c453f2c"),
      new LightSwitch(hap, this.log, "Bett Links", "a24a7f-2c10-f0592c432712"),
      new DimmableLightSwitch(hap, this.log, "Wand", "a24a7f-0c10-f0592c1a45ba")
    ]);
  }
}