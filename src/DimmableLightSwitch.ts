import {
    AccessoryPlugin,
    CharacteristicGetCallback,
    CharacteristicSetCallback,
    CharacteristicValue,
    HAP,
    Logging,
    Service,
    CharacteristicEventTypes
} from "homebridge";

export class DimmableLightSwitch implements AccessoryPlugin {

    private readonly log: Logging;

    private switchBrightness = 0;
    private id: string = "";
    private home_id: string = "";
    private bridge: string = "";

    // This property must be existent!!
    name: string;

    private readonly switchService: Service;
    private readonly informationService: Service;

    constructor(hap: HAP, log: Logging, name: string, id: string, home_id: string, bridge: string) {
        this.log = log;
        this.name = name;
        this.id = id;
        this.home_id = home_id;
        this.bridge = bridge;

        this.switchService = new hap.Service.Lightbulb(name);

        this.switchService.getCharacteristic(hap.Characteristic.On)
            .onGet(() => {
                this.log.info("Current state of the switch was returned: " + (this.switchBrightness > 0 ? "ON" : "OFF"));
                return this.switchBrightness > 0;
            })
            .onSet((value: CharacteristicValue) => {
                this.switchBrightness = value as number;
                this.log.info("Switch state was set to: " + (this.switchBrightness > 0 ? "ON" : "OFF"));
            });

        this.switchService.getCharacteristic(hap.Characteristic.Brightness)
            .onGet(() => {
                return this.switchBrightness;
            })
            .onSet((value: CharacteristicValue) => {
                this.switchBrightness = value as number;
                log.info("Switch brightness was set to: " + this.switchBrightness);
                this.setBrightness(this.switchBrightness);
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

    setBrightness(brightness: number) {
        fetch('https://api.netatmo.com/api/setstate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "home": {
                    "id": this.home_id,
                    "modules": [
                        {
                            "id": this.id,
                            "brightness": brightness,
                            "bridge": this.bridge
                        }
                    ]
                }
            })
        })
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