sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/routing/History",
    "sap/ui/core/UIComponent",
    "com/bmore/inveweb/model/formatter",
    "sap/ui/core/BusyIndicator",
    "sap/m/MessageBox",
    "sap/ui/util/Storage",
    "sap/m/MessageToast",
    "sap/ui/core/Item",
    "sap/m/MessageStrip",
    "thirdparty/axios/dist/axios.min",
    "thirdparty/pdfmake/build/pdfmake.min",
    "thirdparty/xlsx/dist/xlsx.full.min",
  ],
  function (Controller, History, UIComponent, formatter,
    BusyIndicator, MessageBox, Storage, MessageToast,Item,MessageStrip) {
    "use strict";
    const oMyStorage = new Storage(Storage.Type.local, "storage");

    return Controller.extend(
      "com.bmore.inveweb.controller.BaseController",
      {
        formatter: formatter,
        //InveServices: InveServices,
        //hola
        /**
         * Holis
         * Convenience method for getting the view model by name in every controller of the application.
         * @public
         * @param {string} sName the model name
         * @returns {sap.ui.model.Model} the model instance
         */
        getModel: function (sName) {
          return this.getView().getModel(sName);
        },

        /**
         * Convenience method for setting the view model in every controller of the application.
         * @public
         * @param {sap.ui.model.Model} oModel the model instance
         * @param {string} sName the model name
         * @returns {sap.ui.mvc.View} the view instance
         */
        setModel: function (oModel, sName) {
          return this.getView().setModel(oModel, sName);
        },

        /**
         * Convenience method for getting the resource bundle.
         * @public
         * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
         */
        getResourceBundle: function (sKey) {
          return this.getOwnerComponent()
            .getModel("i18n")
            .getResourceBundle()
            .getText(sKey);
        },

        /**
         * Method for navigation to specific view
         * @public
         * @param {string} psTarget Parameter containing the string for the target navigation
         * @param {mapping} pmParameters? Parameters for navigation
         * @param {boolean} pbReplace? Defines if the hash should be replaced (no browser history entry) or set (browser history entry)
         */
        navTo: function (psTarget, pmParameters, pbReplace) {
          this.getRouter().navTo(psTarget, pmParameters, pbReplace);
        },

        getRouter: function () {
          return UIComponent.getRouterFor(this);
        },

        onNavBack: function () {
          let sPreviousHash = History.getInstance().getPreviousHash();

          if (sPreviousHash !== undefined) {
            window.history.back();
          } else {
            this.getRouter().navTo("appHome", {}, true /*no history*/);
          }
        },
        /***************************
         * Section for storage
         * ************************** */
        setSessionDataObject: function (sessionData) {
          oMyStorage.put("sessionData", sessionData);
        },
        getSessionDataObject: function () {

          return oMyStorage.get("sessionData");
        },

        getUserId: function () {

          return oMyStorage.get("sessionData").user.entity.identyId;
        },

        getUserMail: function () {
          return oMyStorage.get("sessionData").user.genInf.email;
        },

        getUserName: function () {

          return oMyStorage.get("sessionData").user.genInf.name;
        },

        getUserLastName: function () {

          return oMyStorage.get("sessionData").user.genInf.lastName;
        },

        getUserFullName: function () {

          return (oMyStorage.get("sessionData").user.genInf.name + " " +
            oMyStorage.get("sessionData").user.genInf.lastName);
        },

        getUserInitials: function () {
          return (oMyStorage.get("sessionData").user.genInf.name.substring(0, 1) +
            oMyStorage.get("sessionData").user.genInf.lastName.substring(0, 1));
        },

        roleExists: function (role) {
          return (oMyStorage.get("sessionData").roles.indexOf(role) != -1);
        },

        getToken: function () {
          return oMyStorage.get("sessionData").token;
        },

        _setToken: function (value) {
          oMyStorage.get("sessionData").token = value;
        },
        getInitDateDashboard: function () {
          return oMyStorage.get("initDate");
        },

        _setInitDateDashboard: function (value) {
          oMyStorage.put("initDate", value);
        },
        getLastDateDashboard: function () {
          return oMyStorage.get("lastDate");
        },

        _setLastDateDashboard: function (value) {
          oMyStorage.put("lastDate", value);
        },

        isSuperUser: function () {
          return oMyStorage.get("sessionData").isSuperUser;
        },

        getUserLevel: function () {
          return oMyStorage.get("sessionData").userLevel;
        },

        getBukrs: function () {
          return oMyStorage.get("sessionData").user.bukrs;
        },

        getWerks: function () {
          return oMyStorage.get("sessionData").user.werks;
        },
        BusyIndicatorOn: function () {
          return BusyIndicator.show(0);
        },
        BusyIndicatorOff: function () {
          return BusyIndicator.hide();
        },
        setOnEdit: function (state) {
          oMyStorage.put("state", state);
        },

        getOnEdit: function () {
          return oMyStorage.get("state");
        },
        /***************************
         * Section for messages
         * ************************** */
        showAlert: function (txt, type) {
          MessageBox.show(txt, {
            icon: type, // default
            title: "Información", // default
            actions: sap.m.MessageBox.Action.OK, // default
            emphasizedAction: sap.m.MessageBox.Action.OK, // default
            onClose: null, // default
            styleClass: "", // default
            initialFocus: null, // default
            textDirection: sap.ui.core.TextDirection.Inherit, // default
          });
        },

        getDocInvFlag: function () {
          return oMyStorage.get("docInvFlag");
        },

        setDocInvFlag: function (flag) {
          oMyStorage.put("docInvFlag", flag);
        },

        copyObjToNew: function (obj) {
          return JSON.parse(JSON.stringify(obj));
        },

        formatDate: function (dt) {

          return `${dt.getDate().toString().padStart(2, "0")}/${(dt.getMonth() + 1).toString().padStart(2, "0")}/${dt.getFullYear().toString().padStart(4, "0")} ${dt.getHours().toString().padStart(2, "0")}:${dt.getMinutes().toString().padStart(2, "0")}:${dt.getSeconds().toString().padStart(2, "0")}`;
        },

        formatLongDate: function (dt) {
          dt = new Date(dt);
          return `${dt.getDate().toString().padStart(2, "0")}/${(dt.getMonth() + 1).toString().padStart(2, "0")}/${dt.getFullYear().toString().padStart(4, "0")} ${dt.getHours().toString().padStart(2, "0")}:${dt.getMinutes().toString().padStart(2, "0")}:${dt.getSeconds().toString().padStart(2, "0")}`;
        },

        toast: function (message, width) {

          MessageToast.show(message, {
            duration: 6000,                  // default
            width: width,                   // default
            my: "center bottom",             // default
            at: "center center",             // default
            of: window,                      // default
            offset: "0 0",                   // default
            collision: "fit fit",            // default
            onClose: null,                   // default
            autoClose: true,                 // default
            animationTimingFunction: "ease", // default
            animationDuration: 1000,         // default
            closeOnBrowserNavigation: true   // default
          });
        },

        execService: function (service, request, nameService, showLog) {
          BusyIndicator.show(0);
          return new Promise((resolve, reject) => {
            axios.post(service, request, {
              headers: {
                Authorization: this.getToken(),
              },
            })
              .then((response) => {
                if (showLog) {
                  console.log("[" + nameService + "]", response);
                }

                const json = response.data;
                if (!json || json.abstractResult.resultId == -108 || json.abstractResult.resultId == -116 || json.abstractResult.resultId == -106) {
                  this.navTo("Login");
                  resolve(false);
                  return;
                }

                if (json.abstractResult.resultId != 1) {

                  MessageBox.show("Error en " + nameService + "\n" + json.abstractResult.resultMsgAbs,
                    MessageBox.Icon.ERROR, "Error");
                  reject(false);


                } else {
                  resolve(json);
                }

                BusyIndicator.hide();
              })
              .catch((error) => {
                MessageBox.show(error.toString(), MessageBox.Icon.ERROR, nameService);
                console.error(error);
                reject(false);
                BusyIndicator.hide();
              });
          });
        },

        execLogin: function (service, request, nameService, showLog) {
          BusyIndicator.show(0);
          return new Promise((resolve, reject) => {
            axios.post(service, request, { headers: {}, })
              .then((response) => {
                if (showLog) {
                  console.log("[" + nameService + "]", response);
                }

                const json = response.data;
                if (json.abstractResult.resultId == -108 || json.abstractResult.resultId == -116) {
                  this.navTo("Login");
                  resolve(false);
                  return;
                }

                if (json.abstractResult.resultId != 1) {

                  MessageBox.show("Error en " + nameService + "\n" + json.abstractResult.resultMsgAbs,
                    MessageBox.Icon.ERROR, "Error");
                  reject(false);


                } else {
                  resolve(json);
                }

                BusyIndicator.hide();
              })
              .catch((error) => {
                MessageBox.show(error.toString(), MessageBox.Icon.ERROR, "Error");
                console.error(error);
                reject(false);
                BusyIndicator.hide();
              });
          });
        },

        checkSession: async function () {
          await this.execService(InveServices.CHECKSESSION, null, "checkSession", this.showLog);
        },

        formatNumber: function (value) {
          return new Intl.NumberFormat("en-US", { minimumFractionDigits: 3 }).format(value);
        },

        getCharSeparator: function () {
          let list = ['a', 'b'], str;
          if (list.toLocaleString) {
              str = list.toLocaleString();
              if (str.indexOf(';') > 0 && str.indexOf(',') == -1) {
                  return ';';
              }
          }
          return ',';
      },

      isOdd: function(num){
        let value = num % 2;
        if(value == 0){
          return true
        }
        return false;
      },

      loadSocieties: async function(controlBukrs){
        const request = {
            tokenObject: null,
            lsObject: ""
        };

        const json = await this.execService(InveServices.GET_BUKRS,request,"loadSocieties",this.showLog);
        if(json){
            //Create a model and bind the table rows to this model
            let selectBukrs = controlBukrs;
            selectBukrs.removeAllItems();
            selectBukrs.destroyItems();
            let data = json.lsObject;
            for (let i in data){

                let item = new Item({
                            text: data[i].bukrs + " - " + data[i].bukrsDesc, // string
                            key: data[i].bukrs, // string
                            tooltip: data[i].bukrs, // sap.ui.core.TooltipBase
                        });
                selectBukrs.addItem(item);
            }
            return selectBukrs;
        }
        
    },

    message: function(message, type, ctrlMsgBox, ctrlFrame, ctrlPage){

      let mTrip = new MessageStrip({
          text: message, // string
          type: type, // sap.ui.core.MessageType
          showIcon: true, // boolean
          showCloseButton: true, // boolean
          close: function(){
            ctrlFrame.setVisible(false);
          }.bind(this),
      });

      let messagesBox = ctrlMsgBox;
      messagesBox.removeAllItems();
      messagesBox.addItem(mTrip);

      ctrlFrame.setVisible(true);

      setTimeout(function() {
          let scrtollTo = ctrlMsgBox;
          ctrlPage.scrollToElement(scrtollTo);
      }.bind(this),50);

  },

  fillWerks: function(data,selectWerks){
    
    for (let i = 0; i < data.length; i++){
      let item = new Item({
                  text: data[i].werks + " - " + data[i].werksDesc, // string
                  key: data[i].werks, // string
                  tooltip: data[i].werks, // TooltipBase
              });
      selectWerks.addItem(item);
    } 
    setTimeout(function() {
      selectWerks.focus();
    }.bind(this),100);
    },
    prepareStatusUsability:function(element){
      try {
        let num =  parseFloat(element.justification);
        if(num <= 10 && num >= -10){
          element.stateJustification = "Success";
        }else if(num > 10 && num <= 49 || num < -10 && num >= -49){
          element.stateJustification = "Warning";
        }else if(num > 49  || num < -49 ){
          element.stateJustification = "Error";
        }
      } catch (e) {
        console.error(e);
      }
    },
    prepareStatusExactitud:function(element){
      try {
        let num =  parseFloat(element.accuracy);
        if(num >= 95){
          element.stateAccuracy = "Success";
        }else if(num < 95 && num >= 80){
          element.stateAccuracy = "Warning";
        }else{
          element.stateAccuracy = "Error";
        }
      } catch (e) {
        console.error(e);
      }
    },
    prepareStatusUsabilidad:function(element){
      try {
        let num =  parseFloat(element.usability);
        if(num >= 95){
          element.stateUsability = "Success";
        }else if(num < 95 && num >= 80){
          element.stateUsability = "Warning";
        }else{
          element.stateUsability = "Error";
        }
      } catch (e) {
        console.error(e);
      }
    },

    setFormat: function(digits,valor){
      return new Intl.NumberFormat("en-US", {minimumFractionDigits: digits}).format(valor);
    },
    downloadFrescuraXLSX: function (modelData,docId) {
      
      if(modelData == undefined || modelData.length == 0){
        this.toast('Sin información para exportar.', "20em");
        return;
      }
      let model = modelData;
      let reformattedArray;

      reformattedArray = model.map(function(obj){
        obj["Almacén"] = obj["lgort"];
        obj["Zona"] = obj["zoneD"];
        obj["Ubicación"] = obj["lgpla"];
        obj["Material"] = obj["matnr"];
        obj["Desc. Material"] = obj["matnrD"];
        obj["Cantidad"] = obj["count1A"];
        obj["Unidad de Medida"] = obj["measureUnit"];
        obj["Lote"] = obj["lote"];
        obj["Nota"] = obj["note"];
        obj["Fecha de Frescura"] = obj["prodDate"];
        obj["Hora de Conteo"] = obj["dateEnd"];
        obj["Estatus PT"] = obj["estatusPt"];
        
        //obj["Conteo Especial"] = obj["countX"];
        //obj["Conteo de Tarima"] = obj["vhilmCount"];
        
        delete obj["dateIni"];
        delete obj["vhilm"];
        delete obj["lgort"];
        delete obj["zoneD"];
        delete obj["lgpla"];
        delete obj["matnr"];
        delete obj["matnrD"];
        delete obj["dateEnd"];
        delete obj["measureUnit"];
        delete obj["count1A"];
        delete obj["countX"];
        delete obj["estatusPt"];
        delete obj["vhilmCount"];
        delete obj["prodDate"];
        delete obj["note"];
        delete obj["lote"];
        delete obj["count1B"];
        delete obj["count2"];
        delete obj["count3"];
        delete obj["flagColor"];
        delete obj["lgobe"];
        delete obj["pkAsgId"];
        delete obj["zoneId"];
        delete obj["build"];
        delete obj["cpc"];
        delete obj["cpp"];
        delete obj["count1AAux"];
        delete obj["countType"];
        delete obj["icon"];
        delete obj["state"];
        
        return obj;
       });
      
      let ws = XLSX.utils.json_to_sheet(reformattedArray);
      let wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, docId);
      
      XLSX.writeFile(wb, "ReporteConteoFrescura - "+docId+".xlsx");
      },
      colorEstatus:function(posicion){
				let mx = this.roleExists("INVE_MX");
				let co = this.roleExists("INVE_CO");
				if(mx){
					this.getColorEstatusMX(posicion,posicion.estatusPt); 
				}else if(co){
					this.getColorEstatusCO(posicion,posicion.estatusPt);
				}else{
					MessageBox.show('Usuario sin rol de pais, favor de verificar',
									MessageBox.Icon.ERROR, "ROL PAIS NO DETECTADO");
				}
			},
			getColorEstatusMX:function(pos,status){
				switch(status){
					case "EN TIEMPO": pos.state =  "Success";
					pos.icon ="sap-icon://accept";
					break;
					case "EN RIESGO": pos.state =  "Warning";
					pos.icon ="sap-icon://status-critical";
					break;
					case "FUERA DE ESP": pos.state =  "Error";
					pos.icon ="sap-icon://status-negative";
					break;
          case "PÉRDIDA": pos.state =  "Information";
					pos.icon ="sap-icon://unpaid-leave";
					break;
					default:pos.state =  "None";
				}
				//console.log("pos",pos);
			},
			getColorEstatusCO:function(pos,status){
				switch(status){
					case "EN TIEMPO": pos.state =  "Warning";
					pos.icon ="sap-icon://status-critical";
					break;
					case "EN RIESGO": pos.state =  "Error";
					pos.icon ="sap-icon://status-negative";
					break;
					case "LIBRE/FUERA DE RIESGO": pos.state =  "Success";
					pos.icon ="sap-icon://accept";
					break;
					case "BLOQUEADO": pos.state =  "Information";
					pos.icon ="sap-icon://begin";
					break;
					default:pos.state =  "None";
				}
				//console.log("pos",pos);
			}
    }
    );
  }
);
