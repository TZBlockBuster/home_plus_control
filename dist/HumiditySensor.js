"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HumiditySensor = void 0;
class HumiditySensor {
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
        this.switchService = new hap.Service.HumiditySensor(name);
        this.switchService.getCharacteristic(hap.Characteristic.CurrentRelativeHumidity)
            .on("get" /* CharacteristicEventTypes.GET */, (callback) => {
            this.getState().then((state) => {
                this.log.info("Successfully get humidity: " + state.humidity);
                callback(0 /* HAPStatus.SUCCESS */, state.humidity);
            });
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
        const response = await fetch('https://api.netatmo.com/api/homestatus?home_id=' + this.home_id, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + this.token
            }
        });
        const data = await response.json();
        const module = data.body.home.rooms.find((room) => room.id === this.id);
        return {
            humidity: module.humidity
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
exports.HumiditySensor = HumiditySensor;
//# sourceMappingURL=HumiditySensor.js.map