"use strict";
const LightSwitch_1 = require("./LightSwitch");
const DimmableLightSwitch_1 = require("./DimmableLightSwitch");
const PLATFORM_NAME = "homebridge-home_plus_control";
const PLUGIN_NAME = "homebridge-home_plus_control";
let hap;
class HomePlusControlPlatform {
    constructor(log, config, api) {
        this.home_id = "";
        this.token = "";
        this.log = log;
        // probably parse config or something here
        log.info("Home + Control Platform Plugin Loading...");
        this.home_id = config["home_id"];
        this.token = config["token"];
        // get json using a http request
        this.reloadAccessories();
        log.info("Example platform finished initializing!");
    }
    reloadAccessories() {
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
            }
            else {
                data["body"]["home"]["modules"].forEach((module) => {
                    if (module["type"] === "BNIL") {
                        HomePlusControlPlatform.LightSwitchState[module["id"]] = module["on"];
                    }
                });
            }
        });
    }
    accessories(callback) {
        callback([
            new LightSwitch_1.LightSwitch(hap, this.log, "Bett Rechts", "a24a7f-2b10-f0592c453f2c"),
            new LightSwitch_1.LightSwitch(hap, this.log, "Bett Links", "a24a7f-2c10-f0592c432712"),
            new DimmableLightSwitch_1.DimmableLightSwitch(hap, this.log, "Wand", "a24a7f-0c10-f0592c1a45ba")
        ]);
    }
}
HomePlusControlPlatform.Accessory = {
    "a24a7f-2b10-f0592c453f2c": "Bett Rechts",
    "a24a7f-2c10-f0592c432712": "Bett Links"
};
HomePlusControlPlatform.LightSwitchState = {};
module.exports = (api) => {
    hap = api.hap;
    api.registerPlatform(PLATFORM_NAME, HomePlusControlPlatform);
};
//# sourceMappingURL=home_plus_control.js.map