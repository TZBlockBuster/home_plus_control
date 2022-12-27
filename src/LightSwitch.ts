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


export class LightSwitch implements AccessoryPlugin {

    private readonly log: Logging;


    public static LightSwitchState: { [key: string]: boolean } = {};

    private switchOn = false;
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


        this.switchService = new hap.Service.Switch(name);
        this.switchService.getCharacteristic(hap.Characteristic.On)
            .onGet(() => {
                this.log.info("Current state of the switch was returned: " + (this.switchOn ? "ON" : "OFF"));
                return LightSwitch.LightSwitchState[this.id];
            })
            .onSet((value: CharacteristicValue) => {
                LightSwitch.LightSwitchState[this.id] = value as boolean;
                this.log.info("Switch state was set to: " + (this.switchOn ? "ON" : "OFF"));
                this.setState(this.switchOn);
            });

        this.informationService = new hap.Service.AccessoryInformation()
            .setCharacteristic(hap.Characteristic.Manufacturer, "BlockWare Studios")
            .setCharacteristic(hap.Characteristic.Model, "Some BTcino Model")
            .setCharacteristic(hap.Characteristic.SerialNumber, id);

        log.info("Light switch '%s' created!", name);
    }

    /*
     * This method is optional to implement. It is called when HomeKit ask to identify the accessory.
     * Typical this only ever happens at the pairing process.
     */
    identify(): void {
        this.log("Identify!");
    }

    setState(state: boolean) {
        fetch('https://api.netatmo.com/api/setstate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + this.token
            },
            body: JSON.stringify({
                home: {
                    id: this.home_id,
                    modules: [
                        {
                            id: this.id,
                            on: state,
                            bridge: this.bridge
                        }
                    ]
                }
            })
        })
            .then(response => response.json())
            .then(data => {
                console.log('Success:', data);
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