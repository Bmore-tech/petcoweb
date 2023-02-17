sap.ui.define([
  "com/bmore/inveweb/controller/BaseController",
  "sap/m/MessageBox",
  "sap/ui/core/BusyIndicator",
  "sap/ui/model/json/JSONModel",
  "sap/ui/core/Item",
  'sap/m/Input',
  "sap/m/Dialog",
  "sap/m/Button",
  "sap/ui/core/util/Export",
  "sap/ui/core/util/ExportTypeCSV",
  "sap/ui/core/MessageType",
  "sap/m/MessageStrip",
], function (Controller, MessageBox, BusyIndicator, JSONModel, Item, Input, Dialog, Button, Export, ExportTypeCSV, MessageType, MessageStrip) {
  'use strict';

  return Controller.extend("com.bmore.inveweb.controller.vReturnableValuation", {
    onInit: function () {
      this.getView().addDelegate({
        onBeforeShow: function (evt) {
          this.showLog = false;
          this.oModel = new JSONModel({ properties: [] });
          this.getView().setModel(this.oModel, "oModel");
          BusyIndicator.hide();
          this.cleanView();
          this.ADMIN_ROLE = this.roleExists("INV_CIC_ADMIN");
          this.byId("idLimpiarFiltro").setVisible(this.ADMIN_ROLE);
          this.setBukrsAndWerks();
        }.bind(this)
      });
    },

    returnAction: function () {
      window.history.go(-1);
    },
    //Events
    tablaSeleccionItem: function (oEvent) {
      this.cancelEdition();
      this.byId("bEdit").setEnabled(true);
    },
    enabledControls: function (state) {
      let itemSelected = this.byId("oTable").getSelectedItems();
      this.byId("bEdit").setEnabled(!state && itemSelected[0] !== undefined);
      this.byId("bCancel").setEnabled(state);
      this.byId("bSave").setEnabled(state);
      this.byId("bDelete").setEnabled(state);
    },
    enabledEdit: function () {
      this.enabledControls(true);

      // this.byId("oTable").getItems().setEnabled(false);

      let itemSelected = this.byId("oTable").getSelectedItems();
      itemSelected[0].getCells()[2].setEnabled(true);
      this.backupValueSelected = itemSelected[0].getCells()[2].getValue();
      this.backupItemSelected = itemSelected[0].getCells()[2];

      let valueEdit = this.backupValueSelected.replace(/[^\d.]/g, '')
      itemSelected[0].getCells()[2].setValue((valueEdit === '0.000' ? '' : valueEdit));
      itemSelected[0].getCells()[2].$().find('input').focus();

    },
    cancelEdition: function () {

      if (this.byId("bCancel").getEnabled()) {
        this.backupItemSelected.setEnabled(false);
        this.backupItemSelected.setValue(this.backupValueSelected);
        //this.byId("oTable").removeSelections(true);        
      }
      else {
        // let itemSelected = this.byId("oTable").getSelectedItems();
        // itemSelected[0].getCells()[2].setEnabled(false);
        // itemSelected[0].getCells()[2].setValue(this.backupValueSelected);
      }
      this.enabledControls(false);
    },
    deleteRecord: async function () {

      MessageBox.confirm("¿Desea eliminar el precio del material?", {
        actions: ["Si", "No"],
        onClose: async function (sAction) {
          if (sAction === "Si") {

            BusyIndicator.show(0);

            let itemSelected = this.byId("oTable").getSelectedItems();
            let listReturnableValuation = [];
            let returnableValuation = new Object();
            let matnr = itemSelected[0].getCells()[0].getText().split(" - ");
            let bwkey = itemSelected[0].getCells()[1].getText().split(" - ");;
            returnableValuation.matnr = matnr[0];
            returnableValuation.bwkey = bwkey[0];
            returnableValuation.zprecio = "";
            listReturnableValuation[0] = returnableValuation;
            const request = {
              tokenObject: null,
              lsObject: listReturnableValuation
            };

            const json = await this.execService(InveServices.SET_RETORNABLES_VALUATION, request, "saveReturnableValuation", this.showLog);

            if (json) {
              BusyIndicator.hide();
              MessageBox.warning("Se eliminó de forma exitosa.");
            }

            this.enabledControls(false);
            // itemSelected[0].getCells()[2].setEnabled(false);
            // itemSelected[0].getCells()[2].setValue(`$${this.formatNumber(0)}`);
            this.searchByWerk();
          }
        }.bind(this)
      });
    },
    saveEdition: async function () {
      BusyIndicator.show(0);

      let itemSelected = this.byId("oTable").getSelectedItems();
      let listReturnableValuation = [];
      let returnableValuation = new Object();
      let matnr = itemSelected[0].getCells()[0].getText().split(" - ");
      let bwkey = itemSelected[0].getCells()[1].getText().split(" - ");;
      returnableValuation.matnr = matnr[0];
      returnableValuation.bwkey = bwkey[0];
      returnableValuation.zprecio = itemSelected[0].getCells()[2].getValue();
      listReturnableValuation[0] = returnableValuation;

      const request = {
        tokenObject: null,
        lsObject: listReturnableValuation
      };
      console.log("--", listReturnableValuation);

      const json = await this.execService(InveServices.SET_RETORNABLES_VALUATION, request, "saveReturnableValuation", this.showLog);

      if (json) {
        BusyIndicator.hide();
      }

      this.enabledControls(false);
      itemSelected[0].getCells()[2].setEnabled(false);
      itemSelected[0].getCells()[2].setValue(`$${this.formatNumber(itemSelected[0].getCells()[2].getValue())}`);

      // this.byId("oTable").removeSelections(true);
    },
    deleteFilter: function () {
      this.byId("idMaterial").setValue("");
      if (this.ADMIN_ROLE) {
        this.byId("bukrs").setSelectedKey(null);
        this.byId("werks").setSelectedKey(null);
        this.byId("werks").removeAllItems();
        this.cleanView();
      } else {
        this.searchByWerk();
      }
    },
    csv: function () {
      let modelData = this.byId("oTable").getModel("oModel").getData().properties;
      if (modelData == undefined || modelData.length == 0) {
        MessageBox.show('Sin información para descargar.',
          MessageBox.Icon.WARNING, "Advertencia");
        return;
      }
      let model = new JSONModel(modelData);

      let oExport = new Export({

        exportType: new ExportTypeCSV({
          fileExtension: "csv",
          separatorChar: this.getCharSeparator()
        }),

        models: model,

        rows: {
          path: "/"
        },

        columns: [
          { name: "Material", template: { content: "{matnr}" } }
          , { name: "Centro", template: { content: "{bwkey}" } }
          , { name: "Precio", template: { content: "{zprecio}" } }
        ]
      });
      oExport.saveFile("Valoración Retornables " + this.formatDate(new Date())).catch(function (oError) {
        console.error("[csv] Error al exportar csv", oError);
      }).then(function () {
        oExport.destroy();

      });

    },
    openFilePicker: function () {
      $('#fileReturnableValuation').click();
    },

    uploadTemplate: function () {
      let that = this;
      this.eraseNotification();

      let file = $('#fileReturnableValuation').prop('files')[0];
      let allowedFiles = ['csv'];
      let ext = file.name.split('.').pop().toLowerCase();
      let arrTosend = [];
      // Check if is an allowed file
      if (allowedFiles.indexOf(ext) == -1) {
        this.toast("Tipo de archivo no permitido, " +
          "solo se permiten archivos de tipo: " + allowedFiles, '20em');
        $('#fileReturnableValuation').val("");
        return;
      }

      let reader = new FileReader();

      // Read file into memory
      reader.readAsText(file, 'ISO-8859-1');

      // Handle errors load
      reader.onload = loadHandler;
      reader.onerror = errorHandler;

      async function loadHandler(event) {

        let csv = event.target.result;
        await processData(csv);

      }

      async function processData(csv) {

        let allTextLines = csv.split(/\r\n|\n/);
        let data;
        let size = allTextLines.length;

        if (allTextLines[size - 1].indexOf(",") == -1) {
          allTextLines.splice(-1);
        }

        BusyIndicator.show();

        //valida todos los registros en el array
        let errores = allTextLines.slice(1).filter((item) => {
          let line = item.split(",");
          let matnr = line[0];
          let bwkey = line[1];
          let zprecio = line[2];
          return (matnr.length == 0 || bwkey.length == 0 || bwkey.length >= 5 || zprecio.length == 0 || isNaN(zprecio))
        });

        //si hay errores, genera las leyendas de cada registro
        let erroresLegend = errores.reduce((LegendSum, item) => {
          return LegendSum + `\n\n Error en el registro: ${String(item)}`
        }, '');

        //si hay errores, muestra el mensaje de error en la consola y valida si es mayor del texto en pantalla lo abrevia
        if (erroresLegend.length > 90) {
          console.log('Errores:\n\n', errores);
          erroresLegend = erroresLegend.substring(0, erroresLegend.indexOf('E', 90)) + `\n\n... Errores encontrados: ${errores.length}`;
        }

        //muestra el mensaje de error el usuario
        if (errores.length > 0) {
          that.toast(erroresLegend);
          BusyIndicator.hide();
          return;
        };

        arrTosend = allTextLines.slice(1).map((item) => {
          let line = item.split(",");
          return {
            matnr: line[0],
            bwkey: line[1],
            zprecio: line[2]
          }
        });
        

        // for (let i = 1; i < allTextLines.length; i++) {

        //     data = allTextLines[i].split(',');

        //     if(data[0]===""){            
        //       BusyIndicator.hide();
        //       console.log("datos:", data[0]); 
        //       that.toast("Falta el id del material en la linea: "+ (i + 1));             
        //       return;
        //     }	   
        //     if((data[1])===""){            
        //       BusyIndicator.hide();
        //       console.log("datos:", data[1]); 
        //       that.toast("Falta el id del centro en la linea: "+ (i + 1));             
        //       return;
        //     }        
        //     if(data[2] && isNaN(data[2])){         
        //       BusyIndicator.hide();   
        //       console.log("datos:", data[2]);      
        //       that.toast("Valor no númerico en el precio de la linea: "+ (i + 1));
        //       return;
        //     }
        //     arrTosend.push({"matnr": data[0],"bwkey":data[1],"zprecio":data[2]});                        
        //   }

          const request = {
                  tokenObject: null,
                  lsObject: arrTosend
                };
          console.log("log",request);
          let result = await that.execService(InveServices.SET_RETORNABLES_VALUATION,request,"saveMasiveReturnableValuation",that.showLog);         
          
          if(result) {
            BusyIndicator.hide();

            if(result.lsObject){
              that.message(result.lsObject.slice(1).join('\n\n') , MessageType.Success,that.byId("messagesBox"),that.byId("vbFrame"),that.byId("pReturnableValuation"));
              setTimeout(function () {
                that.byId("messagesBox").getItems()[0].close();
              }.bind(this), 8000);
            }

            if(result.lsObject[0].length > 0){
              that.toast(result.lsObject[0]);
            }

            //recarga la grilla
            that.getReturnablesValuation();
          }
      }

      function errorHandler(evt) {

        if (evt.target.error.name == "NotReadableError") {
          MessageBox.show('No se puede leer el archivo.',
            MessageBox.Icon.ERROR, "Error");
        }
      }

      $('#fileReturnableValuation').val("");
    },
    //Methods   
    
    eraseNotification: function () {
      this.byId("vbFrame").setVisible(false);
    },
    formatDate: function (dt) {

      return `${dt.getDate().toString().padStart(2, '0')}/${(dt.getMonth() + 1).toString().padStart(2, '0')}/${dt.getFullYear().toString().padStart(4, '0')} ${dt.getHours().toString().padStart(2, '0')}:${dt.getMinutes().toString().padStart(2, '0')}:${dt.getSeconds().toString().padStart(2, '0')}`
    },
    setRetornableValuation: async function (list) {

      const request = {
        tokenObject: null,
        lsObject: list
      };

      const json = await this.execService(InveServices.SET_RETORNABLE_VALUATION, request, "setRetornableValuation", this.showLog);

      if (json) {
        BusyIndicator.hide();
        let updateMatnr = json.abstractResult.resultMsgAbs != undefined ? json.abstractResult.resultMsgAbs : "";
        this.message('Materiales  cargados exitosamente ' + updateMatnr, MessageType.Success,this.byId("messagesBox"),this.byId("vbFrame"),this.byId("pReturnableValuation"));
        setTimeout(function () {
          this.byId("messagesBox").getItems()[0].close();
        }.bind(this), 8000);

        this.getRetornableValuation();
      }

    },
    downloadTemplate: function () {

      let link = document.createElement("a");
      link.href = InveTemplates.RETORNABLES;
      link.click();
    },
    cleanView: function () {

      // Empty table
      this.byId("oTable").removeSelections();
      this.oModel.setProperty("/properties", []);
      this.enabledControls(false);
    },
    setBukrsAndWerks: async function () {
      await this.loadSocieties(this.byId("bukrs"));
      if (!this.ADMIN_ROLE) {

        let bukrs = this.getBukrs();
        this.byId("bukrs").setSelectedKey(bukrs);
        this.byId("bukrs").setEnabled(false);

        let cmbxWerks = this.byId("werks");
        if (cmbxWerks.getItems().length == 0) {
          await this.loadWerks();
        }

        let werks = this.getWerks();
        this.byId("werks").setSelectedKey(werks);
        this.byId("werks").setEnabled(false);
        this.searchByWerk();
      } else {

        this.byId("bukrs").setSelectedKey(null);
        this.byId("bukrs").setEnabled(true);
        this.byId("werks").removeAllItems();
        this.byId("werks").destroyItems();
        this.byId("werks").setSelectedKey(null);
        this.byId("werks").setEnabled(true);
      }
    },

    loadWerks: async function () {

      this.eraseNotification();

      let bukrsBean = {
        bukrs: this.byId('bukrs').getSelectedKey()
      }

      this.cleanView();

      const request = {
        tokenObject: null,
        lsObject: bukrsBean
      };

      const json = await this.execService(InveServices.GET_BUKRS_AND_WERKS, request, "loadWerks", this.showLog);

      if (json) {
        let selectWerks = this.byId("werks");
        selectWerks.removeAllItems();
        selectWerks.destroyItems();
        selectWerks.setSelectedKey(null);

        let data = json.lsObject;


        if (data.length != 0) {

          this.fillWerks(data,selectWerks);

        } else {

          MessageBox.show('La "Sociedad" seleccionada no cuenta con centros asociados',
            MessageBox.Icon.ERROR, "Sin centros");

        }
      }
    },
    searchByMaterial: async function () {
      if (this.byId('werks').getSelectedKey() == undefined || this.byId('werks').getSelectedKey() == "") {
        MessageBox.show("Favor de seleccionar sociedad y centro",
          MessageBox.Icon.ERROR, "Datos incompletos");
        return;
      }
      BusyIndicator.show(0);
      this.cleanView();

      try {

        let matnrBean = {
          bwkey: this.byId('werks').getSelectedKey(),
          matnr: this.byId('idMaterial').getValue()
        }

        if (matnrBean.matnr === "" && matnrBean.bwkey === "") {
          BusyIndicator.hide();
          //Eliminar el campo tambien lanza el evento de "searh"
          // MessageBox.show('El id del material es requerido.',
          // MessageBox.Icon.WARNING, "Campo requerido");

          return;
        }

        let json = await this.loadReturnableValuation(matnrBean);

        if (json) {
            let data = json.lsObject;
            this.oModel.setProperty("/properties", data);

            let matnr = this.byId("idMaterial").getValue();
            let bukrs = this.byId("bukrs").getSelectedItem().getText();
            let werks = this.byId("werks").getSelectedItem().getText();
            if ((data == undefined || data.length == 0) && matnr != undefined && matnr.length > 1) {
              if (json.abstractResult.intCom1 == 1) {
                matnr = json.abstractResult.resultMsgCom;
                MessageBox.confirm('Material ' + matnr + '\nSin precio.\n\n¿Desea agregar precio al material?\n\nSociedad: ' + bukrs + ' \nCentro: ' + werks,
                  {
                    icon: MessageBox.Icon.QUESTION,
                    actions: [MessageBox.Action.YES,
                    MessageBox.Action.NO],
                    onClose: function (oAction) {
                      if (oAction == 'YES') {

                        //validar matnr pa agregarlo
                        this.showDialogAlta();

                      }
                    }.bind(this)
                  });
              } else {
                MessageBox.show("No existe el material " + matnr + " para el centro " + werks + "\nFavor de verificar",
                  MessageBox.Icon.ERROR, "Sin información");
              }

            }
          }
      }
      catch (error) {
        console.log(error);
      }
      BusyIndicator.hide();

    },

    showDialogAlta: function (evt) {
      if (!this.oDialogAlta) {

        this.oDialogAlta = new Dialog({
          id: 'oDialogAlta', // ID
          title: "Ingrese precio", // string
          contentWidth: "20%", // CSSSize,
          content: [new Input("inputPrice", { width: "95%", type: "Number" }).addStyleClass("sapUiTinyMarginBegin sapUiTinyMarginEnd")], // Control
          beginButton: new Button({
            text: 'Aceptar',
            type: "Accept",
            press: async function () {
              let listReturnableValuation = [];
              let returnableValuation = new Object();
              returnableValuation.matnr = this.byId("idMaterial").getValue();
              returnableValuation.bwkey = this.byId("werks").getSelectedKey();
              returnableValuation.zprecio = sap.ui.getCore().byId("inputPrice").getValue();
              listReturnableValuation.push(returnableValuation);

              const request = {
                tokenObject: null,
                lsObject: listReturnableValuation
              };
              this.oDialogAlta.close();

              const json = await this.execService(InveServices.SET_RETORNABLES_VALUATION, request, "saveReturnableValuation", this.showLog);

              if (json) {
                BusyIndicator.hide();
                this.message("Precio de material guardado exitosamente", MessageType.Success,this.byId("messagesBox"),this.byId("vbFrame"),this.byId("pReturnableValuation"));
                this.searchByWerk();
                setTimeout(function () {
                  this.byId("messagesBox").getItems()[0].close();
                }.bind(this), 4000);
              }
            }.bind(this)
          }),
          endButton: new Button({
            text: 'Cancelar',
            type: "Reject",
            press: function () {
              this.oDialogAlta.close();
            }.bind(this)
          })
        });
      }
      this.oDialogAlta.addStyleClass("sapUiTinyMarginBegin sapUiTinyMarginEnd");
      this.oDialogAlta.open();
    },

    searchByWerk: async function () {
      BusyIndicator.show(0);
      try {

        this.cleanView();

        let werksBean = {
          bwkey: this.byId('werks').getSelectedKey(),
          matnr: this.byId('idMaterial').getValue()
        }

        let json = await this.loadReturnableValuation(werksBean);

        if (json) {
          let data = json.lsObject;
          this.oModel.setProperty("/properties", data);
        }
      }
      catch (error) {
        console.log(error);
      }
      BusyIndicator.hide();

    },
    validateInput: function () {
      let txtMaterial = this.byId("idMaterial");
      txtMaterial.setValue(txtMaterial.getValue().replace(/[^\d.]/g, ''));
    },
    loadReturnableValuation: async function (filter) {
      const request = {
        tokenObject: null,
        lsObject: filter
      };

      const json = await this.execService(InveServices.GET_RETORNABLES_VALUATION, request, "load", this.showLog);
      json.lsObject.forEach(element => {
        if (isNaN(element.zprecio)) element.zprecio = 0;
      });

      return json;
    }
  })
});