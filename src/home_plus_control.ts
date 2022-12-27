import {API, Categories, CharacteristicSetCallback, CharacteristicValue, DynamicPlatformPlugin, HAP, Logging, PlatformAccessory, PlatformAccessoryEvent, PlatformConfig,} from "homebridge";

const PLATFORM_NAME = "homebridge-home_plus_control";
const PLUGIN_NAME = "homebridge-home_plus_control";

let hap: HAP;
let Accessory: typeof PlatformAccessory;

export = (api: API) => {
    hap = api.hap;
    Accessory = api.platformAccessory;

    api.registerPlatform(PLATFORM_NAME, HomePlusControlPlatform);
};

class HomePlusControlPlatform implements DynamicPlatformPlugin {


    private readonly log: Logging;


    private readonly homeAccessories: PlatformAccessory[] = [];

    public static IDToIDLookup: { [id: string]: string } = {};

    public static Accessories: string[] = []
    public static AccessoryName: { [key: string]: string } = {};
    public static AccessoryBridge: { [key: string]: string } = {};
    public static LightSwitchState: { [key: string]: boolean } = {};

    private home_id: string = "";
    private token: string = "";

    private readonly api: API;

    constructor(log: Logging, config: PlatformConfig, api: API) {
        this.log = log;
        this.api = api;

        // probably parse config or something here

        log.info("Home + Control Platform Plugin Loading...");


        this.home_id = config["home_id"];
        this.token = config["token"];


        try {
            this.loadAccessories();
        } catch (e) {
            this.log.error("Error loading accessories: " + e);
        }

        // get json using a http request

        log.info("Example platform finished initializing!");
    }


    loadAccessories(): void {
        this.log.info("Loading accessories...");
        this.loadAsyncAccessories().then(() => {
            for (const id of HomePlusControlPlatform.Accessories) {
                this.log.info("Adding accessory with id " + id);
                this.addAccessory(HomePlusControlPlatform.AccessoryName[id], id);
            }
            this.log.info("Loaded accessories: " + HomePlusControlPlatform.Accessories);
        });
    }

    async loadAsyncAccessories() {
        const response = await fetch('https://api.netatmo.com/api/homesdata', {
            method: 'GET',
            headers: {
                'accept': 'application/json',
                'Authorization': 'Bearer ' + this.token
            }
        })
        const data = await response.json()
        this.log.info("Got data: " + JSON.stringify(data));
        if (data["error"] != null) {
            this.log.error("Error: " + data["error"]["message"]);
        } else if (data["body"]["homes"] != null) {
            data["body"]["homes"].forEach((home: any) => {
                if (home["modules"] != null) {
                    home["modules"].forEach((module: any) => {
                        if (module["type"] === "BNLD") {
                            HomePlusControlPlatform.Accessories.push(module["id"])
                            HomePlusControlPlatform.AccessoryName[module["id"]] = module["name"]
                            HomePlusControlPlatform.AccessoryBridge[module["id"]] = module["bridge"]
                        }
                    });
                } else {
                    this.log.error("No modules found for home " + home["name"])
                }
            });
        }
    }

    configureAccessory(accessory: PlatformAccessory): void {

        this.log("Configuring accessory %s", accessory.displayName);

        accessory.on(PlatformAccessoryEvent.IDENTIFY, () => {
            this.log("%s identified!", accessory.displayName);
        });


        accessory.getService(hap.Service.Switch)!.getCharacteristic(hap.Characteristic.On)
            .onGet(() => {
                return HomePlusControlPlatform.LightSwitchState[accessory.UUID];
            })
            .onSet((value: CharacteristicValue) => {
                HomePlusControlPlatform.LightSwitchState[accessory.UUID] = value as boolean;
                this.setState(HomePlusControlPlatform.IDToIDLookup[accessory.UUID], value as boolean).then(r => {
                    this.log.info("Set state of " + accessory.displayName + " to " + value);
                });
            });

        accessory.getService(hap.Service.AccessoryInformation)!.setCharacteristic(hap.Characteristic.Model, "Home+ Control Light Switch");
        accessory.getService(hap.Service.AccessoryInformation)!.setCharacteristic(hap.Characteristic.Manufacturer, "Netatmo");
        accessory.getService(hap.Service.AccessoryInformation)!.setCharacteristic(hap.Characteristic.SerialNumber, HomePlusControlPlatform.IDToIDLookup[accessory.UUID]);

        this.homeAccessories.push(accessory);
    }


    async setState(id: string, state: boolean) {
        const response = await fetch('https://api.netatmo.com/api/setstate', {
            method: 'POST',
            body: JSON.stringify({
                home: {
                    id: this.home_id,
                    modules: [
                        {
                            id: id,
                            on: state,
                            bridge: HomePlusControlPlatform.AccessoryBridge[id]
                        }]
                }
            }),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + this.token
            }
        });
    }

    addAccessory(name: string, id: string): void {
        this.log.info("Adding new accessory with name %s", name);

        const uuid = hap.uuid.generate(name);
        const accessory = new Accessory(name, uuid, Categories.SWITCH);

        HomePlusControlPlatform.IDToIDLookup[uuid] = id;

        accessory.addService(hap.Service.Switch, name);

        this.configureAccessory(accessory);
        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
    }
}