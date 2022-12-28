"use strict";
const DimmableLightSwitch_1 = require("./DimmableLightSwitch");
const WindowCovering_1 = require("./WindowCovering");
const Fan_1 = require("./Fan");
const Thermostat_1 = require("./Thermostat");
const AuthManager_1 = require("./AuthManager");
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
        if (this.token == undefined) {
            AuthManager_1.AuthManager.sendAuthRequestURL(log, config["client_id"], config["client_secret"], config["hostname"]);
        }
        else {
            HomePlusControlPlatform.Accessory = config["accessories"];
            HomePlusControlPlatform.WindowCovers = config["window_covers"];
            HomePlusControlPlatform.Fans = config["fans"];
            HomePlusControlPlatform.Thermostats = config["thermostats"];
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
            for (const id in HomePlusControlPlatform.Thermostats) {
                log.info("Adding humidity sensor with id " + id + " and name " + HomePlusControlPlatform.Thermostats[id]);
                HomePlusControlPlatform.ThermostatList.push(id);
            }
        }
        // get json using a http request
        log.info("Home + Control finished initializing!");
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
        for (const id of HomePlusControlPlatform.ThermostatList) {
            this.log.info("Adding humidity sensor with id " + id);
            foundAccessories.push(new Thermostat_1.Thermostat(hap, this.log, HomePlusControlPlatform.Thermostats[id], id, this.home_id, "00:03:50:a2:4a:7f", this.token));
        }
        callback(foundAccessories);
    }
}
HomePlusControlPlatform.Accessory = {};
HomePlusControlPlatform.WindowCovers = {};
HomePlusControlPlatform.Fans = {};
HomePlusControlPlatform.Thermostats = {};
HomePlusControlPlatform.Accessories = [];
HomePlusControlPlatform.WindowCoverList = [];
HomePlusControlPlatform.FanList = [];
HomePlusControlPlatform.ThermostatList = [];
module.exports = (api) => {
    hap = api.hap;
    api.registerPlatform(PLUGIN_NAME, PLATFORM_NAME, HomePlusControlPlatform);
};
//# sourceMappingURL=home_plus_control.js.map