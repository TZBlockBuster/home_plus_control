"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WindowCovering = void 0;
const HomePlusControlCache_1 = require("./HomePlusControlCache");
class WindowCovering {
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
        this.switchService = new hap.Service.WindowCovering(name);
        this.switchService.getCharacteristic(hap.Characteristic.CurrentPosition)
            .on("get" /* CharacteristicEventTypes.GET */, (callback) => {
            this.getState().then((state) => {
                this.log.info("Successfully get current position: " + state.current_position);
                callback(0 /* HAPStatus.SUCCESS */, state.current_position);
            });
        });
        this.switchService.getCharacteristic(hap.Characteristic.TargetPosition)
            .on("get" /* CharacteristicEventTypes.GET */, (callback) => {
            this.getState().then((state) => {
                const target_position = state.target_position == 50 ? state.current_position : state.target_position;
                this.log.info("Successfully get target position: " + target_position);
                callback(0 /* HAPStatus.SUCCESS */, target_position);
            });
        })
            .onSet((value) => {
            this.setWindowCoverPosition(value);
            WindowCovering.WindowCoveringState[this.id] = value;
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
    setWindowCoverPosition(position) {
        this.setState(position)
            .then(() => {
            this.log.info("Successfully set position to: " + position);
            WindowCovering.WindowCoveringCurrent[this.id] = position;
        });
    }
    async getState() {
        const data = await HomePlusControlCache_1.HomePlusControlCache.getHomeStatus(this.home_id, this.token);
        const module = data.body.home.modules.find((module) => module.id === this.id);
        return {
            current_position: module.current_position,
            target_position: module.target_position
        };
    }
    async setState(state) {
        HomePlusControlCache_1.HomePlusControlCache.forceUpdate = true;
        const response = await fetch('https://api.netatmo.com/api/setstate', {
            method: 'POST',
            body: JSON.stringify({
                home: {
                    id: this.home_id,
                    modules: [
                        {
                            id: this.id,
                            target_position: state,
                            bridge: this.bridge
                        }
                    ]
                }
            }),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + this.token
            }
        });
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
exports.WindowCovering = WindowCovering;
WindowCovering.WindowCoveringState = {};
WindowCovering.WindowCoveringCurrent = {};
//# sourceMappingURL=WindowCovering.js.map