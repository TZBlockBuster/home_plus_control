"use strict";
const LightSwitch_1 = require("./LightSwitch");
const netatmo_1 = require("netatmo");
const PLATFORM_NAME = "homebridge-home_plus_control";
const PLUGIN_NAME = "homebridge-home_plus_control";
let hap;
class HomePlusControlPlatform {
    constructor(log, config, api) {
        this.auth = {
            "client_id": "",
            "client_secret": "",
            "username": "",
            "password": ""
        };
        this.getHomeData = function (err, data) {
            console.log(data);
        };
        this.home_id = "";
        this.token = "";
        this.log = log;
        // probably parse config or something here
        log.info("Home + Control Platform Plugin Loading...");
        this.home_id = config["home_id"];
        this.token = config["token"];
        this.auth["client_id"] = config["client_id"];
        this.auth["client_secret"] = config["client_secret"];
        this.auth["username"] = config["username"];
        this.auth["password"] = config["password"];
        this.api = new netatmo_1.Netatmo(this.auth);
        this.api.on('get-homedata', this.getHomeData);
        // get json using a http request
        this.loadAccessories();
        log.info("Example platform finished initializing!");
    }
    reloadAccessories() {
        this.log.info(this.home_id);
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
            }
            else {
                data["body"]["home"]["modules"].forEach((module) => {
                    if (module["type"] === "BNLD") {
                        HomePlusControlPlatform.Accessories.push(module["id"]);
                    }
                });
            }
        });
    }
    loadAccessories() {
    }
    accessories(callback) {
        var foundAccessories = [];
        for (const id of HomePlusControlPlatform.Accessories) {
            this.log.info("Adding accessory with id " + id);
            foundAccessories.push(new LightSwitch_1.LightSwitch(hap, this.log, HomePlusControlPlatform.AccessoryName[id], id));
        }
        callback(foundAccessories);
        /*callback([
            new LightSwitch(hap, this.log, "Bett Rechts", "a24a7f-2b10-f0592c453f2c"),
            new LightSwitch(hap, this.log, "Bett Links", "a24a7f-2c10-f0592c432712"),
            new DimmableLightSwitch(hap, this.log, "Wand", "a24a7f-0c10-f0592c1a45ba")
        ]);*/
    }
}
HomePlusControlPlatform.Accessory = {
    "a24a7f-2b10-f0592c453f2c": "Bett Rechts",
    "a24a7f-2c10-f0592c432712": "Bett Links"
};
HomePlusControlPlatform.Accessories = [];
HomePlusControlPlatform.AccessoryName = {};
HomePlusControlPlatform.LightSwitchState = {};
module.exports = (api) => {
    hap = api.hap;
    api.registerPlatform(PLATFORM_NAME, HomePlusControlPlatform);
};
//# sourceMappingURL=home_plus_control.js.map