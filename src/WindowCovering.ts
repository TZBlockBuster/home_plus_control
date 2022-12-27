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

export class WindowCovering implements AccessoryPlugin {

    private readonly log: Logging;

    public static WindowCoveringState: { [key: string]: number } = {};
    public static WindowCoveringCurrent: { [key: string]: number } = {};
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

        this.switchService = new hap.Service.WindowCovering(name);

        this.switchService.getCharacteristic(hap.Characteristic.CurrentPosition)
            .onGet(() => {
                return WindowCovering.WindowCoveringCurrent[this.id];
            })

        this.switchService.getCharacteristic(hap.Characteristic.TargetPosition)
            .onGet(() => {
                return WindowCovering.WindowCoveringState[this.id];
            })
            .onSet((value: CharacteristicValue) => {
                this.setWindowCoverPosition(value as number);
                WindowCovering.WindowCoveringState[this.id] = value as number;
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

    setWindowCoverPosition(position: number) {
        this.setState(position)
            .then(() => {
                this.log.info("Successfully set position to: " + position);
                WindowCovering.WindowCoveringCurrent[this.id] = position;
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
                            target_position: state,
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