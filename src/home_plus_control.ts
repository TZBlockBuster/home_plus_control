import {AccessoryPlugin, API, HAP, Logging, PlatformConfig, StaticPlatformPlugin,} from "homebridge";
import {DimmableLightSwitch} from "./DimmableLightSwitch";
import {WindowCovering} from "./WindowCovering";
import {Fan} from "./Fan";
import {Thermostat} from "./Thermostat";
import {AuthManager} from "./AuthManager";

const PLATFORM_NAME = "homebridge-home_plus_control";
const PLUGIN_NAME = "homebridge-home_plus_control";

let hap: HAP;

export = (api: API) => {
    hap = api.hap;

    api.registerPlatform(PLUGIN_NAME, PLATFORM_NAME, HomePlusControlPlatform);
};

class HomePlusControlPlatform implements StaticPlatformPlugin {


    private readonly log: Logging;

    public static Accessory: { [key: string]: string } = {}
    public static WindowCovers: { [key: string]: string } = {}
    public static Fans: { [key: string]: string } = {}
    public static Thermostats: { [key: string]: string } = {}


    public static Accessories: string[] = []
    public static WindowCoverList: string[] = []
    public static FanList: string[] = []
    public static ThermostatList: string[] = []

    private home_id: string = "";
    private token: string = "";

    constructor(log: Logging, config: PlatformConfig, api: API) {
        this.log = log;

        // probably parse config or something here

        log.info("Home + Control Platform Plugin Loading...");

        this.home_id = config["home_id"];
        this.token = config["token"];
        if (this.token == undefined) {
            AuthManager.sendAuthRequestURL(log, config["client_id"], config["client_secret"], config["hostname"]);
        } else {
            HomePlusControlPlatform.Accessory = config["accessories"];
            HomePlusControlPlatform.WindowCovers = config["window_covers"];
            HomePlusControlPlatform.Fans = config["fans"];
            HomePlusControlPlatform.Thermostats = config["thermostats"];

            for (const id in HomePlusControlPlatform.Accessory) {
                log.info("Adding accessory with id " + id + " and name " + HomePlusControlPlatform.Accessory[id]);
                HomePlusControlPlatform.Accessories.push(id);
            }

            for (const id in HomePlusControlPlatform.WindowCovers) {
                log.info("Adding window cover with id " + id + " and name " + HomePlusControlPlatform.WindowCovers[id]);
                HomePlusControlPlatform.WindowCoverList.push(id);
            }

            for (const id in HomePlusControlPlatform.Fans) {
                log.info("Adding fan with id " + id + " and name " + HomePlusControlPlatform.Fans[id]);
                HomePlusControlPlatform.FanList.push(id);
            }

            for (const id in HomePlusControlPlatform.Thermostats) {
                log.info("Adding humidity sensor with id " + id + " and name " + HomePlusControlPlatform.Thermostats[id]);
                HomePlusControlPlatform.ThermostatList.push(id);
            }
        }

        // get json using a http request

        log.info("Home + Control finished initializing!");
    }

    accessories(callback: (foundAccessories: AccessoryPlugin[]) => void): void {
        var foundAccessories: AccessoryPlugin[] = [];
        for (const id of HomePlusControlPlatform.Accessories) {
            this.log.info("Adding accessory with id " + id);
            foundAccessories.push(new DimmableLightSwitch(hap, this.log, HomePlusControlPlatform.Accessory[id], id, this.home_id, "00:03:50:a2:4a:7f", this.token));
        }
        for (const id of HomePlusControlPlatform.WindowCoverList) {
            this.log.info("Adding window cover with id " + id);
            foundAccessories.push(new WindowCovering(hap, this.log, HomePlusControlPlatform.WindowCovers[id], id, this.home_id, "00:03:50:a2:4a:7f", this.token));
        }
        for (const id of HomePlusControlPlatform.FanList) {
            this.log.info("Adding fan with id " + id);
            foundAccessories.push(new Fan(hap, this.log, HomePlusControlPlatform.Fans[id], id, this.home_id, "00:03:50:a2:4a:7f", this.token));
        }
        for (const id of HomePlusControlPlatform.ThermostatList) {
            this.log.info("Adding humidity sensor with id " + id);
            foundAccessories.push(new Thermostat(hap, this.log, HomePlusControlPlatform.Thermostats[id], id, this.home_id, "00:03:50:a2:4a:7f", this.token));
        }
        callback(foundAccessories);
    }
}