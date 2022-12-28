import {
    AccessoryPlugin,
    CharacteristicGetCallback,
    CharacteristicSetCallback,
    CharacteristicValue,
    HAP,
    Logging,
    Service,
    CharacteristicEventTypes, HAPStatus
} from "homebridge";

export class Thermostat implements AccessoryPlugin {

    private readonly log: Logging;
    private id: string = "";
    private home_id: string = "";
    private bridge: string = "";
    private token: string = "";

    // This property must be existent!!
    name: string;

    private readonly switchService: Service;
    private readonly informationService: Service;

    constructor(hap: HAP, log: Logging, name: string, id: string, home_id: string, bridge: string, token: string) {
        this.log = log;
        this.name = name;
        this.id = id;
        this.home_id = home_id;
        this.bridge = bridge;
        this.token = token;

        this.switchService = new hap.Service.Thermostat(name);

        this.switchService.getCharacteristic(hap.Characteristic.CurrentRelativeHumidity)
            .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
                this.getState().then((state) => {
                    this.log.info("Successfully get humidity: " + state.humidity);
                    callback(HAPStatus.SUCCESS, state.humidity);
                });
            })

        this.switchService.getCharacteristic(hap.Characteristic.CurrentHeatingCoolingState)
            .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
               this.getState().then((state) => {
                     this.log.info("Successfully get state: " + state.state);
                     callback(HAPStatus.SUCCESS, state.state);
               });
            });

        this.switchService.getCharacteristic(hap.Characteristic.TargetHeatingCoolingState)
            .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
               this.getState().then((state) => {
                     this.log.info("Successfully get state: " + state.state);
                     callback(HAPStatus.SUCCESS, state.state);
               });
            });

        this.switchService.getCharacteristic(hap.Characteristic.CurrentTemperature)
            .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
                this.getState().then((state) => {
                    this.log.info("Successfully get current temperature: " + state.currentTemperature);
                    callback(HAPStatus.SUCCESS, state.currentTemperature);
                });
            });

        this.switchService.getCharacteristic(hap.Characteristic.TargetTemperature)
            .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
                this.getState().then((state) => {
                    this.log.info("Successfully get target temperature: " + state.targetTemperature);
                    callback(HAPStatus.SUCCESS, state.targetTemperature);
                });
            });

        this.switchService.getCharacteristic(hap.Characteristic.TemperatureDisplayUnits)
            .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
                callback(HAPStatus.SUCCESS, 0);
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
    identify(): void {
        this.log("Identify!");
    }

    async getState(): Promise<any> {

        const response = await fetch('https://api.netatmo.com/api/homestatus?home_id=' + this.home_id, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + this.token
            }
        });
        const data = await response.json();
        const module = data.body.home.rooms.find((room: any) => room.id === this.id);
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
    getServices(): Service[] {
        return [
            this.informationService,
            this.switchService,
        ];
    }

}