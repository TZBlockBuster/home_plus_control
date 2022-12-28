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

export class Fan implements AccessoryPlugin {

    private readonly log: Logging;

    public static FanState: { [key: string]: boolean } = {};
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

        this.switchService = new hap.Service.Fan(name);

        this.switchService.getCharacteristic(hap.Characteristic.On)
            .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
                this.getState().then((state) => {
                    this.log.info("Successfully get current position: " + state.on);
                    callback(HAPStatus.SUCCESS, state.on);
                });
            })
            .onSet((value: CharacteristicValue) => {
                this.setFanState(value as boolean);
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

    setFanState(position: boolean) {
        this.setState(position)
            .then(() => {
                this.log.info("Successfully set position to: " + position);
                Fan.FanState[this.id] = position;
            });
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
        const module = data.body.home.modules.find((module: any) => module.id === this.id);
        return {
            on: module.on
        };
    }

    async setState(state: boolean) {
        const response = await fetch('https://api.netatmo.com/api/setstate', {
            method: 'POST',
            body: JSON.stringify({
                home: {
                    id: this.home_id,
                    modules: [
                        {
                            id: this.id,
                            on: state,
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