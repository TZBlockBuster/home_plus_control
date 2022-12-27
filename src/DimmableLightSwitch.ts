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

    public static LightBrightnessState: { [key: string]: number } = {};
    public static LightSwitchState: { [key: string]: boolean } = {};
    private switchBrightness = 0;
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

        this.switchService = new hap.Service.Lightbulb(name);

        this.switchService.getCharacteristic(hap.Characteristic.Brightness)
            .onGet(() => {
                return DimmableLightSwitch.LightSwitchState[this.id] ? DimmableLightSwitch.LightBrightnessState[this.id] : 0;
            })
            .onSet((value: CharacteristicValue) => {
                this.switchBrightness = value as number;
                log.info("Switch brightness was set to: " + this.switchBrightness);
                this.setBrightness(this.switchBrightness);
                DimmableLightSwitch.LightBrightnessState[this.id] = this.switchBrightness;
                DimmableLightSwitch.LightSwitchState[this.id] = this.switchBrightness > 0;
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
        this.setState(brightness)
            .then(() => {
                this.log.info("Successfully set brightness to: " + brightness);
            });

        /*fetch('https://api.netatmo.com/api/setstate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + this.token
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
            .then(response => response.json())
            .then(data => {
                console.log('Success:', data);
            });*/
    }

    async setState(state: number) {
        const response = await fetch('https://api.netatmo.com/api/setstate', {
            method: 'POST',
            body: JSON.stringify({
                home: {
                    id: this.home_id,
                    modules: [
                        {
                            id: this.id,
                            brightness: state,
                            on: state > 0,
                            bridge: this.bridge
                        }]
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
    getServices(): Service[] {
        return [
            this.informationService,
            this.switchService,
        ];
    }

}