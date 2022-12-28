"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Thermostat = void 0;
const HomePlusControlCache_1 = require("./HomePlusControlCache");
class Thermostat {
    constructor(hap, log, name, id, home_id, bridge, token) {
        this.id = "";
        this.home_id = "";
        this.bridge = "";
        this.token = "";
        this.log = log;
        this.name = name;
        this.id = id;
        this.home_id = home_id;
        this.bridge = bridge;
        this.token = token;
        this.switchService = new hap.Service.Thermostat(name);
        this.switchService.getCharacteristic(hap.Characteristic.CurrentRelativeHumidity)
            .on("get" /* CharacteristicEventTypes.GET */, (callback) => {
            this.getState().then((state) => {
                this.log.info("Successfully get humidity: " + state.humidity);
                callback(0 /* HAPStatus.SUCCESS */, state.humidity);
            });
        });
        this.switchService.getCharacteristic(hap.Characteristic.CurrentHeatingCoolingState)
            .on("get" /* CharacteristicEventTypes.GET */, (callback) => {
            this.getState().then((state) => {
                this.log.info("Successfully get state: " + state.state);
                callback(0 /* HAPStatus.SUCCESS */, state.state);
            });
        });
        this.switchService.getCharacteristic(hap.Characteristic.TargetHeatingCoolingState)
            .on("get" /* CharacteristicEventTypes.GET */, (callback) => {
            this.getState().then((state) => {
                this.log.info("Successfully get state: " + state.state);
                callback(0 /* HAPStatus.SUCCESS */, state.state);
            });
        });
        this.switchService.getCharacteristic(hap.Characteristic.CurrentTemperature)
            .on("get" /* CharacteristicEventTypes.GET */, (callback) => {
            this.getState().then((state) => {
                this.log.info("Successfully get current temperature: " + state.currentTemperature);
                callback(0 /* HAPStatus.SUCCESS */, state.currentTemperature);
            });
        });
        this.switchService.getCharacteristic(hap.Characteristic.TargetTemperature)
            .on("get" /* CharacteristicEventTypes.GET */, (callback) => {
            this.getState().then((state) => {
                this.log.info("Successfully get target temperature: " + state.targetTemperature);
                callback(0 /* HAPStatus.SUCCESS */, state.targetTemperature);
            });
        });
        this.switchService.getCharacteristic(hap.Characteristic.TemperatureDisplayUnits)
            .on("get" /* CharacteristicEventTypes.GET */, (callback) => {
            callback(0 /* HAPStatus.SUCCESS */, 0);
        });
        this.informationService = new hap.Service.AccessoryInformation()
            .setCharacteristic(hap.Characteristic.Manufacturer, "BlockWare Studios")
            .setCharacteristic(hap.Characteristic.Model, "Some BTcino Model")
            .setCharacteristic(hap.Characteristic.SerialNumber, id);
        log.info("Dimmable Light switch '%s' created!", name);
    }
    /*
     * This method is optional to implement. It is called when HomeKit ask to identify the accessory.
     * Typical this only ever happens at the pairing process.
     */
    identify() {
        this.log("Identify!");
    }
    async getState() {
        const data = await HomePlusControlCache_1.HomePlusControlCache.getHomeStatus(this.home_id, this.token);
        const module = data.body.home.rooms.find((room) => room.id === this.id);
        return {
            humidity: module.humidity,
            state: module.heating_power_request,
            currentTemperature: module.therm_measured_temperature,
            targetTemperature: module.therm_setpoint_temperature
        };
    }
    /*
     * This method is called directly after creation of this instance.
     * It should return all services which should be added to the accessory.
     */
    getServices() {
        return [
            this.informationService,
            this.switchService,
        ];
    }
}
exports.Thermostat = Thermostat;
//# sourceMappingURL=Thermostat.js.map