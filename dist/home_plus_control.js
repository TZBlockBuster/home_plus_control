"use strict";
const DimmableLightSwitch_1 = require("./DimmableLightSwitch");
const WindowCovering_1 = require("./WindowCovering");
const Fan_1 = require("./Fan");
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
        HomePlusControlPlatform.Accessory = config["accessories"];
        HomePlusControlPlatform.WindowCovers = config["window_covers"];
        HomePlusControlPlatform.Fans = config["fans"];
        for (const id in HomePlusControlPlatform.Accessory) {
            log.info("Adding accessory with id " + id + " and name " + HomePlusControlPlatform.Accessory[id]);
            HomePlusControlPlatform.Accessories.push(id);
        }
        for (const id in HomePlusControlPlatform.WindowCovers) {
            log.info("Adding window cover with id " + id + " and name " + HomePlusControlPlatform.WindowCovers[id]);
            HomePlusControlPlatform.WindowCoverList.push(id);
        }
        for (const id in HomePlusControlPlatform.Fans) {
            log.info("Adding fan with id " + id + " and name " + HomePlusControlPlatform.Fans[id]);
            HomePlusControlPlatform.FanList.push(id);
        }
        //this.loadAccessories();
        // get json using a http request
        log.info("Home + Control finished initializing!");
    }
    loadAccessories() {
        this.log.info("Loading accessories...");
        this.loadAsyncAccessories().then(() => {
            this.log.info("Loaded Data: " + DimmableLightSwitch_1.DimmableLightSwitch.LightBrightnessState.toString());
        });
    }
    async loadAsyncAccessories() {
        const response = await fetch('https://api.netatmo.com/api/homestatus?home_id=' + this.home_id, {
            method: 'GET',
            headers: {
                'accept': 'application/json',
                'Authorization': 'Bearer ' + this.token
            }
        });
        const data = await response.json();
        this.log.info("Got data: " + JSON.stringify(data));
        if (data["error"] != null) {
            this.log.error("Error: " + data["error"]["message"]);
        }
        else if (data["body"]["homes"] != null) {
            data["body"]["homes"].forEach((home) => {
                if (home["modules"] != null) {
                    home["modules"].forEach((module) => {
                        if (module["type"] === "BNLD") {
                            HomePlusControlPlatform.AccessoryName[module["id"]] = module["name"];
                            DimmableLightSwitch_1.DimmableLightSwitch.LightBrightnessState[module["id"]] = module["brightness"];
                            DimmableLightSwitch_1.DimmableLightSwitch.LightSwitchState[module["id"]] = module["on"];
                        }
                    });
                }
                else {
                    this.log.error("No modules found for home " + home["name"]);
                }
            });
        }
    }
    accessories(callback) {
        var foundAccessories = [];
        for (const id of HomePlusControlPlatform.Accessories) {
            this.log.info("Adding accessory with id " + id);
            foundAccessories.push(new DimmableLightSwitch_1.DimmableLightSwitch(hap, this.log, HomePlusControlPlatform.Accessory[id], id, this.home_id, "00:03:50:a2:4a:7f", this.token));
        }
        for (const id of HomePlusControlPlatform.WindowCoverList) {
            this.log.info("Adding window cover with id " + id);
            foundAccessories.push(new WindowCovering_1.WindowCovering(hap, this.log, HomePlusControlPlatform.WindowCovers[id], id, this.home_id, "00:03:50:a2:4a:7f", this.token));
        }
        for (const id of HomePlusControlPlatform.FanList) {
            this.log.info("Adding fan with id " + id);
            foundAccessories.push(new Fan_1.Fan(hap, this.log, HomePlusControlPlatform.Fans[id], id, this.home_id, "00:03:50:a2:4a:7f", this.token));
        }
        callback(foundAccessories);
    }
}
HomePlusControlPlatform.Accessory = {
    "a24a7f-2b10-f0592c453f2c": "Bett Rechts",
    "a24a7f-2c10-f0592c432712": "Bett Links"
};
HomePlusControlPlatform.WindowCovers = {};
HomePlusControlPlatform.Fans = {};
HomePlusControlPlatform.Accessories = [];
HomePlusControlPlatform.WindowCoverList = [];
HomePlusControlPlatform.FanList = [];
HomePlusControlPlatform.AccessoryName = {};
module.exports = (api) => {
    hap = api.hap;
    api.registerPlatform(PLATFORM_NAME, HomePlusControlPlatform);
};
//# sourceMappingURL=home_plus_control.js.map