sap.ui.define([
  "com/bmore/inveweb/controller/BaseController",
  "sap/m/MessageBox",
  "sap/ui/core/BusyIndicator",
  "sap/ui/model/json/JSONModel",
  "sap/ui/core/Item",
  'sap/ui/Device',
  "sap/ui/core/Fragment",
  "sap/m/MessageToast",
  "sap/ui/core/util/Export",
  "sap/ui/core/util/ExportTypeCSV",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterType",
  "sap/ui/model/FilterOperator",
], function (Controller, MessageBox, BusyIndicator, JSONModel, Item, Device, Fragment, MessageToast, Export, ExportTypeCSV,Filter,FilterType,FilterOperator) {
  "use strict";

  return Controller.extend("com.bmore.inveweb.controller.vClassificationSystem", {

    onInit: function () {

      this.byId("bExport").setEnabled(false);
      this.byId("srchFieldBD").setEnabled(false);
      this.setInstructionsForFileArmados();

      this.SystemClassModel = new JSONModel({
        armados: []
      });

      this.modelAltaArmados = new JSONModel();
      this.getView().setModel(this.modelAltaArmados, "modelAltaArmados");
      this.dialogTableModel = new JSONModel([]);
      this.getView().setModel(this.dialogTableModel, "dialogTableModel");
      let cmbxArmados = this.byId("cmbxArmados");
      cmbxArmados.removeAllItems();
      cmbxArmados.destroyItems();

      this.getArmadosInve();
      this.getView().setModel(this.SystemClassModel, "SystemClassModel");
      this.byId("idLblDate").setText("");

      this.getView().addDelegate({

        onBeforeShow: function (evt) {

          this.rowDialogTable = null;
          this.cleanAndHideAll();
          if (this.Init) {
            this.byId("inputSelectMatnr").setValue("");
            this.byId("inputSelectMatnr").setTooltip("");
            this.byId("cmbxArmados").setSelectedKey(null);
            this.byId("frmElmArmados").setVisible(false);
            this.resetButtons();
            this.Edited = false;
            setTimeout(function () {
              $("#vClassificationSystem--inputSelectMatnr-inner").attr("readonly", "readonly");
            }, 500);
            BusyIndicator.hide();
          } else {
            this.Init = true;
          }


        }.bind(this)
      });

    },

    onAfterRendering: function () {
      setTimeout(function () {
        $("#vClassificationSystem--inputSelectMatnr-inner").attr("readonly", "readonly");
      }, 500);
    },
    resetButtons: function () {
      this.byId("btnAddMatnr").setEnabled(true);
      this.byId("btnAddZCPP").setEnabled(false);
      this.byId("btnAEditZCPP").setEnabled(false);
      this.byId("btnSaveZCPC").setVisible(false);
      this.byId("btnAddZCPC").setVisible(false);
      this.byId("btnRemoveZCPC").setVisible(false);
      this.byId("btnCancelZCPP").setVisible(false);

      this.byId("btnAddZPPC").setEnabled(false);
      this.byId("btnContinueAddZPPC").setVisible(false);
      this.byId("btnEditZPPC").setEnabled(false);
      this.byId("btnCancelZPPC").setVisible(false);
      this.byId("btnSaveZPPC").setVisible(false);

      this.byId("inputSelectMatnr").setEnabled(true);
    },

    returnAction: function () {

      if (this.EditedZCPP) {
        this.byId("btnAddZCPC").setVisible(false);
        this.byId("btnRemoveZCPC").setVisible(false);
        this.byId("btnAddZCPC").setEnabled(true);
        this.byId("btnRemoveZCPC").setEnabled(true);
        this.byId("btnCancelZCPP").setVisible(false);
        this.byId("btnSaveZCPC").setVisible(false);
        this.byId("inputSelectMatnr").setEnabled(true);
        this.changeEnabledZCPC();
        this.showMainMenu();
        this.EditedZCPP = false;
      }

      if (this.EditedZPPC) {
        this.changeEnabledZPPC();
        this.byId("btnAddZPPC").setVisible(true);
        this.byId("btnContinueAddZPPC").setVisible(false);
        this.byId("btnEditZPPC").setVisible(true);
        this.byId("btnSaveZPPC").setVisible(false);
        this.byId("btnCancelZPPC").setVisible(false);
        this.byId("sgmntBtnsArmados").setEnabled(true);
        this.byId("cmbxArmados").setEnabled(true);
        this.byId("inputSelectMatnr").setEnabled(true);
        this.EditedZPPC = false;
      }
      this.resetButtons();
      this.Edited = false;
      window.history.go(-1);
    },

    onNav: function (oEvent) {

      let selectedKey = oEvent.getSource().getProperty("selectedKey");

      switch (selectedKey) {
        case "search":
          this.byId("txtAreaAttch").setVisible(false);
          break;
        case "dataBase":
          this.byId("txtAreaAttch").setVisible(false);
          break;
        case "attachFile":
          this.byId("txtAreaAttch").setVisible(true);
          break;
        default: console.log("[vClassificationSystem] Tab no reconocido");
      }
    },

    execGetClassification: async function () {

      const json = await this.execService(InveServices.GET_CLASSIFICATION, {}, "getClassification", this.showLog);

      if (json) {
        if (json.lsObject.objectData.length > 0) {
          this.byId("bExport").setEnabled(true);
          this.byId("srchFieldBD").setEnabled(true);
        } else {
          this.byId("bExport").setEnabled(false);
          this.byId("srchFieldBD").setEnabled(false);
        }
        BusyIndicator.hide();
        return json.lsObject.objectData;
      }
    },

    getClassification: async function () {

      BusyIndicator.show(0);

      try {
        let data = await this.execGetClassification();
        this.SystemClassModel.setProperty("/armados", data);
      } catch (error) {
        MessageBox.error("Ocurrió un problema mientras se buscaban los datos de clasificación\n" + error,
          MessageBox.Icon.ERROR);

        BusyIndicator.hide();
      }


    },

    exportTable: function () {

      let modelData = this.getView().getModel("SystemClassModel").getData().armados;
      if (modelData == undefined || modelData.length == 0) {

        MessageBox.show('Sin información para exportar.',
          MessageBox.Icon.ERROR, "Error");
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
          { name: "Material", template: { content: "{object}" } }
          , { name: "Descripción", template: { content: "{maktx}" } }
          , { name: "Caracteristica", template: { content: "{smbez}" } }
          , { name: "Valor", template: { content: "{atflv}" } }
          , { name: "Descripción del Valor", template: { content: "{atnam}" } }
        ]
      });

      oExport.saveFile("Sistema de Clasificación-" + new Date()).catch(function (oError) {
        console.error(oError);
      }).then(function () {
        oExport.destroy();
      });

    },

    generateItem: function (cmbx, text, key, tooltip, selectedItem) {


      let item = new Item({
        text: text, // string
        key: key, // string
        tooltip: tooltip, // sap.ui.core.TooltipBase										
      });
      cmbx.addItem(item);
      if (selectedItem) {
        cmbx.setSelectedItem(item);
        cmbx.fireChange();
      }
    },

    getArmadosInve: async function () {
      BusyIndicator.show(0);
      let armados = await this.execGetArmadosInve();
      this.systemClassData = armados;

      if (this.Edited) {
        this.dialogTableModel.setProperty("/", this.systemClassData);
        let foundMaterial = false;
        this.byId("inputSelectMatnr").setEnabled(true);
        this.Edited = false;
        for (let i in armados) {
          if (armados[i].matnr == this.rowDialogTable.matnr) {
            this.rowDialogTable = armados[i];
            this.byId("inputSelectMatnr").setValue(this.rowDialogTable.matnr + " - " + this.rowDialogTable.maktx);
            this.onChangeMatnr();
            foundMaterial = true;
            break;
          }
        }
        if (!foundMaterial) {
          this.rowDialogTable = null;
          this.byId("inputSelectMatnr").setValue(null);
          this.byId("inputSelectMatnr").setTooltip(null);
          this.byId("cmbxArmados").setSelectedKey(null);
          this.byId("frmElmArmados").setVisible(false);
          this.byId("btnAEditZCPP").setEnabled(false);
          this.byId("btnAddZCPP").setEnabled(false);

          this.cleanAndHideAll();
        }

      }
      setTimeout(function () {
        $("#vClassificationSystem--inputSelectMatnr-inner").attr("readonly", "readonly");
      }, 500);
      BusyIndicator.hide();
    },

    setSelected: function () {
      if (this.flagFirstItem) {
        return false;
      } else {
        this.flagFirstItem = true;
        return true;
      }
    },

    onChangeMatnr: function () {

      setTimeout(function () {
        $("#vClassificationSystem--inputSelectMatnr-inner").attr("readonly", "readonly");
      }, 500);
      this.byId("frmElmArmados").setVisible(true);

      this.byId("btnAEditZCPP").setEnabled(true);
      this.cleanAndHideAll();
      let cmbxArmados = this.byId("cmbxArmados");
      cmbxArmados.setSelectedKey(null);
      cmbxArmados.removeAllItems();
      cmbxArmados.destroyItems();

      this.flagFirstItem = false;
      let zcpp = this.rowDialogTable.zcpp;

      if (zcpp.zcpp1Value != "0.000") {
        this.generateItem(cmbxArmados, zcpp.zcpp1Desc, zcpp.zcpp1Desc, zcpp.zcpp1Desc, this.setSelected());
      }
      if (zcpp.zcpp2Value != "0.000") {
        this.generateItem(cmbxArmados, zcpp.zcpp2Desc, zcpp.zcpp2Desc, zcpp.zcpp2Desc, this.setSelected());
      }
      if (zcpp.zcpp3Value != "0.000") {
        this.generateItem(cmbxArmados, zcpp.zcpp3Desc, zcpp.zcpp3Desc, zcpp.zcpp3Desc, this.setSelected());
      }
      if (zcpp.zcpp4Value != "0.000") {
        this.generateItem(cmbxArmados, zcpp.zcpp4Desc, zcpp.zcpp4Desc, zcpp.zcpp4Desc, this.setSelected());
      }
      if (zcpp.zcpp5Value != "0.000") {
        this.generateItem(cmbxArmados, zcpp.zcpp5Desc, zcpp.zcpp5Desc, zcpp.zcpp5Desc, this.setSelected());
      }
      if (zcpp.zcpp6Value != "0.000") {
        this.generateItem(cmbxArmados, zcpp.zcpp6Desc, zcpp.zcpp6Desc, zcpp.zcpp6Desc, this.setSelected());
      }
      if (zcpp.zcpp7Value != "0.000") {
        this.generateItem(cmbxArmados, zcpp.zcpp7Desc, zcpp.zcpp7Desc, zcpp.zcpp7Desc, this.setSelected());
      }
      if (zcpp.zcpp8Value != "0.000") {
        this.generateItem(cmbxArmados, zcpp.zcpp8Desc, zcpp.zcpp8Desc, zcpp.zcpp8Desc, this.setSelected());
      }
      if (zcpp.zcpp9Value != "0.000") {
        this.generateItem(cmbxArmados, zcpp.zcpp9Desc, zcpp.zcpp9Desc, zcpp.zcpp9Desc, this.setSelected());
      }
      this.configureAddRemoveBtnsZCPP();
      this.loadZPPC();
    },

    onChangeArmados: function () {
      this.cleanAndHideAll();
      setTimeout(function () {
        $("#vClassificationSystem--inputSelectMatnr-inner").attr("readonly", "readonly");
      }, 500);
      let armado = this.byId("cmbxArmados").getSelectedKey();
      let objArmados = this.rowDialogTable;


      switch (armado) {
        case objArmados.zcpp.zcpp1Desc:
          this.byId("stInCPP").setValue(objArmados.zcpp.zcpp1Value);
          this.byId("lblCPP").setText(objArmados.zcpp.zcpp1Desc);
          this.byId("frmElmCPP").setVisible(true);
          break;
        case objArmados.zcpp.zcpp2Desc:
          this.byId("stInCPP").setValue(objArmados.zcpp.zcpp2Value);
          this.byId("lblCPP").setText(objArmados.zcpp.zcpp2Desc);
          this.byId("frmElmCPP").setVisible(true);
          break;
        case objArmados.zcpp.zcpp3Desc:
          this.byId("stInCPP").setValue(objArmados.zcpp.zcpp3Value);
          this.byId("lblCPP").setText(objArmados.zcpp.zcpp3Desc);
          this.byId("frmElmCPP").setVisible(true);
          break;
        case objArmados.zcpp.zcpp4Desc:
          this.byId("stInCPP").setValue(objArmados.zcpp.zcpp4Value);
          this.byId("lblCPP").setText(objArmados.zcpp.zcpp4Desc);
          this.byId("frmElmCPP").setVisible(true);
          break;
        case objArmados.zcpp.zcpp5Desc:
          this.byId("stInCPP").setValue(objArmados.zcpp.zcpp5Value);
          this.byId("lblCPP").setText(objArmados.zcpp.zcpp5Desc);
          this.byId("frmElmCPP").setVisible(true);
          break;
        case objArmados.zcpp.zcpp6Desc:
          this.byId("stInCPP").setValue(objArmados.zcpp.zcpp6Value);
          this.byId("lblCPP").setText(objArmados.zcpp.zcpp6Desc);
          this.byId("frmElmCPP").setVisible(true);
          break;
        case objArmados.zcpp.zcpp7Desc:
          this.byId("stInCPP").setValue(objArmados.zcpp.zcpp7Value);
          this.byId("lblCPP").setText(objArmados.zcpp.zcpp7Desc);
          this.byId("frmElmCPP").setVisible(true);
          break;
        case objArmados.zcpp.zcpp8Desc:
          this.byId("stInCPP").setValue(objArmados.zcpp.zcpp8Value);
          this.byId("lblCPP").setText(objArmados.zcpp.zcpp8Desc);
          this.byId("frmElmCPP").setVisible(true);
          break;
        case objArmados.zcpp.zcpp9Desc:
          this.byId("stInCPP").setValue(objArmados.zcpp.zcpp9Value);
          this.byId("lblCPP").setText(objArmados.zcpp.zcpp9Desc);
          this.byId("frmElmCPP").setVisible(true);
          break;
        default: 
        MessageBox.show(" NO es posible modificar el nombre del armado. \nFavor de seleccionar un armado existente en la lista",
          MessageBox.Icon.WARNING, "Advertencia");
          return;
      }
      this.loadZCPC(armado);
      this.loadZPPC();
    },

    loadZCPC: function (zcpp) {
      let objArmados = this.rowDialogTable;
      switch (zcpp) {
        case objArmados.zcpp.zcpp1Desc:
          if (objArmados.zcpc.zcpc1_1Value != "0.000") {
            this.byId("stInCPC1").setValue(objArmados.zcpc.zcpc1_1Value);
            this.byId("frmElmCPC1").setVisible(true);
          }
          if (objArmados.zcpc.zcpc1_2Value != "0.000") {
            this.byId("stInCPC2").setValue(objArmados.zcpc.zcpc1_2Value);
            this.byId("frmElmCPC2").setVisible(true);
          }
          if (objArmados.zcpc.zcpc1_3Value != "0.000") {
            this.byId("stInCPC3").setValue(objArmados.zcpc.zcpc1_3Value);
            this.byId("frmElmCPC3").setVisible(true);
          }
          if (objArmados.zcpc.zcpc1_4Value != "0.000") {
            this.byId("stInCPC4").setValue(objArmados.zcpc.zcpc1_4Value);
            this.byId("frmElmCPC4").setVisible(true);
          }
          if (objArmados.zcpc.zcpc1_5Value != "0.000") {
            this.byId("stInCPC5").setValue(objArmados.zcpc.zcpc1_5Value);
            this.byId("frmElmCPC5").setVisible(true);
          }
          if (objArmados.zcpc.zcpc1_6Value != "0.000") {
            this.byId("stInCPC6").setValue(objArmados.zcpc.zcpc1_6Value);
            this.byId("frmElmCPC6").setVisible(true);
          }
          if (objArmados.zcpc.zcpc1_7Value != "0.000") {
            this.byId("stInCPC7").setValue(objArmados.zcpc.zcpc1_7Value);
            this.byId("frmElmCPC7").setVisible(true);
          }
          if (objArmados.zcpc.zcpc1_8Value != "0.000") {
            this.byId("stInCPC8").setValue(objArmados.zcpc.zcpc1_8Value);
            this.byId("frmElmCPC8").setVisible(true);
          }
          if (objArmados.zcpc.zcpc1_9Value != "0.000") {
            this.byId("stInCPC9").setValue(objArmados.zcpc.zcpc1_9Value);
            this.byId("frmElmCPC9").setVisible(true);
          }

          break;
        case objArmados.zcpp.zcpp2Desc:
          if (objArmados.zcpc.zcpc2_1Value != "0.000") {
            this.byId("stInCPC1").setValue(objArmados.zcpc.zcpc2_1Value);
            this.byId("frmElmCPC1").setVisible(true);
          }
          if (objArmados.zcpc.zcpc2_2Value != "0.000") {
            this.byId("stInCPC2").setValue(objArmados.zcpc.zcpc2_2Value);
            this.byId("frmElmCPC2").setVisible(true);
          }
          if (objArmados.zcpc.zcpc2_3Value != "0.000") {
            this.byId("stInCPC3").setValue(objArmados.zcpc.zcpc2_3Value);
            this.byId("frmElmCPC3").setVisible(true);
          }
          if (objArmados.zcpc.zcpc2_4Value != "0.000") {
            this.byId("stInCPC4").setValue(objArmados.zcpc.zcpc2_4Value);
            this.byId("frmElmCPC4").setVisible(true);
          }
          if (objArmados.zcpc.zcpc2_5Value != "0.000") {
            this.byId("stInCPC5").setValue(objArmados.zcpc.zcpc2_5Value);
            this.byId("frmElmCPC5").setVisible(true);
          }
          if (objArmados.zcpc.zcpc2_6Value != "0.000") {
            this.byId("stInCPC6").setValue(objArmados.zcpc.zcpc2_6Value);
            this.byId("frmElmCPC6").setVisible(true);
          }
          if (objArmados.zcpc.zcpc2_7Value != "0.000") {
            this.byId("stInCPC7").setValue(objArmados.zcpc.zcpc2_7Value);
            this.byId("frmElmCPC7").setVisible(true);
          }
          if (objArmados.zcpc.zcpc2_8Value != "0.000") {
            this.byId("stInCPC8").setValue(objArmados.zcpc.zcpc2_8Value);
            this.byId("frmElmCPC8").setVisible(true);
          }
          if (objArmados.zcpc.zcpc2_9Value != "0.000") {
            this.byId("stInCPC9").setValue(objArmados.zcpc.zcpc2_9Value);
            this.byId("frmElmCPC9").setVisible(true);
          }
          break;
        case objArmados.zcpp.zcpp3Desc:
          if (objArmados.zcpc.zcpc3_1Value != "0.000") {
            this.byId("stInCPC1").setValue(objArmados.zcpc.zcpc3_1Value);
            this.byId("frmElmCPC1").setVisible(true);
          }
          if (objArmados.zcpc.zcpc3_2Value != "0.000") {
            this.byId("stInCPC2").setValue(objArmados.zcpc.zcpc3_2Value);
            this.byId("frmElmCPC2").setVisible(true);
          }
          if (objArmados.zcpc.zcpc3_3Value != "0.000") {
            this.byId("stInCPC3").setValue(objArmados.zcpc.zcpc3_3Value);
            this.byId("frmElmCPC3").setVisible(true);
          }
          if (objArmados.zcpc.zcpc3_4Value != "0.000") {
            this.byId("stInCPC4").setValue(objArmados.zcpc.zcpc3_4Value);
            this.byId("frmElmCPC4").setVisible(true);
          }
          if (objArmados.zcpc.zcpc3_5Value != "0.000") {
            this.byId("stInCPC5").setValue(objArmados.zcpc.zcpc3_5Value);
            this.byId("frmElmCPC5").setVisible(true);
          }
          if (objArmados.zcpc.zcpc3_6Value != "0.000") {
            this.byId("stInCPC6").setValue(objArmados.zcpc.zcpc3_6Value);
            this.byId("frmElmCPC6").setVisible(true);
          }
          if (objArmados.zcpc.zcpc3_7Value != "0.000") {
            this.byId("stInCPC7").setValue(objArmados.zcpc.zcpc3_7Value);
            this.byId("frmElmCPC7").setVisible(true);
          }
          if (objArmados.zcpc.zcpc3_8Value != "0.000") {
            this.byId("stInCPC8").setValue(objArmados.zcpc.zcpc3_8Value);
            this.byId("frmElmCPC8").setVisible(true);
          }
          if (objArmados.zcpc.zcpc3_9Value != "0.000") {
            this.byId("stInCPC9").setValue(objArmados.zcpc.zcpc3_9Value);
            this.byId("frmElmCPC9").setVisible(true);
          }
          break;
        case objArmados.zcpp.zcpp4Desc:
          if (objArmados.zcpc.zcpc4_1Value != "0.000") {
            this.byId("stInCPC1").setValue(objArmados.zcpc.zcpc4_1Value);
            this.byId("frmElmCPC1").setVisible(true);
          }
          if (objArmados.zcpc.zcpc4_2Value != "0.000") {
            this.byId("stInCPC2").setValue(objArmados.zcpc.zcpc4_2Value);
            this.byId("frmElmCPC2").setVisible(true);
          }
          if (objArmados.zcpc.zcpc4_3Value != "0.000") {
            this.byId("stInCPC3").setValue(objArmados.zcpc.zcpc4_3Value);
            this.byId("frmElmCPC3").setVisible(true);
          }
          if (objArmados.zcpc.zcpc4_4Value != "0.000") {
            this.byId("stInCPC4").setValue(objArmados.zcpc.zcpc4_4Value);
            this.byId("frmElmCPC4").setVisible(true);
          }
          if (objArmados.zcpc.zcpc4_5Value != "0.000") {
            this.byId("stInCPC5").setValue(objArmados.zcpc.zcpc4_5Value);
            this.byId("frmElmCPC5").setVisible(true);
          }
          if (objArmados.zcpc.zcpc4_6Value != "0.000") {
            this.byId("stInCPC6").setValue(objArmados.zcpc.zcpc4_6Value);
            this.byId("frmElmCPC6").setVisible(true);
          }
          if (objArmados.zcpc.zcpc4_7Value != "0.000") {
            this.byId("stInCPC7").setValue(objArmados.zcpc.zcpc4_7Value);
            this.byId("frmElmCPC7").setVisible(true);
          }
          if (objArmados.zcpc.zcpc4_8Value != "0.000") {
            this.byId("stInCPC8").setValue(objArmados.zcpc.zcpc4_8Value);
            this.byId("frmElmCPC8").setVisible(true);
          }
          if (objArmados.zcpc.zcpc4_9Value != "0.000") {
            this.byId("stInCPC9").setValue(objArmados.zcpc.zcpc4_9Value);
            this.byId("frmElmCPC9").setVisible(true);
          }
          break;
        case objArmados.zcpp.zcpp5Desc:
          if (objArmados.zcpc.zcpc5_1Value != "0.000") {
            this.byId("stInCPC1").setValue(objArmados.zcpc.zcpc5_1Value);
            this.byId("frmElmCPC1").setVisible(true);
          }
          if (objArmados.zcpc.zcpc5_2Value != "0.000") {
            this.byId("stInCPC2").setValue(objArmados.zcpc.zcpc5_2Value);
            this.byId("frmElmCPC2").setVisible(true);
          }
          if (objArmados.zcpc.zcpc5_3Value != "0.000") {
            this.byId("stInCPC3").setValue(objArmados.zcpc.zcpc5_3Value);
            this.byId("frmElmCPC3").setVisible(true);
          }
          if (objArmados.zcpc.zcpc5_4Value != "0.000") {
            this.byId("stInCPC4").setValue(objArmados.zcpc.zcpc5_4Value);
            this.byId("frmElmCPC4").setVisible(true);
          }
          if (objArmados.zcpc.zcpc5_5Value != "0.000") {
            this.byId("stInCPC5").setValue(objArmados.zcpc.zcpc5_5Value);
            this.byId("frmElmCPC5").setVisible(true);
          }
          if (objArmados.zcpc.zcpc5_6Value != "0.000") {
            this.byId("stInCPC6").setValue(objArmados.zcpc.zcpc5_6Value);
            this.byId("frmElmCPC6").setVisible(true);
          }
          if (objArmados.zcpc.zcpc5_7Value != "0.000") {
            this.byId("stInCPC7").setValue(objArmados.zcpc.zcpc5_7Value);
            this.byId("frmElmCPC7").setVisible(true);
          }
          if (objArmados.zcpc.zcpc5_8Value != "0.000") {
            this.byId("stInCPC8").setValue(objArmados.zcpc.zcpc5_8Value);
            this.byId("frmElmCPC8").setVisible(true);
          }
          if (objArmados.zcpc.zcpc5_9Value != "0.000") {
            this.byId("stInCPC9").setValue(objArmados.zcpc.zcpc5_9Value);
            this.byId("frmElmCPC9").setVisible(true);
          }
          break;
        case objArmados.zcpp.zcpp6Desc:
          if (objArmados.zcpc.zcpc6_1Value != "0.000") {
            this.byId("stInCPC1").setValue(objArmados.zcpc.zcpc6_1Value);
            this.byId("frmElmCPC1").setVisible(true);
          }
          if (objArmados.zcpc.zcpc6_2Value != "0.000") {
            this.byId("stInCPC2").setValue(objArmados.zcpc.zcpc6_2Value);
            this.byId("frmElmCPC2").setVisible(true);
          }
          if (objArmados.zcpc.zcpc6_3Value != "0.000") {
            this.byId("stInCPC3").setValue(objArmados.zcpc.zcpc6_3Value);
            this.byId("frmElmCPC3").setVisible(true);
          }
          if (objArmados.zcpc.zcpc6_4Value != "0.000") {
            this.byId("stInCPC4").setValue(objArmados.zcpc.zcpc6_4Value);
            this.byId("frmElmCPC4").setVisible(true);
          }
          if (objArmados.zcpc.zcpc6_5Value != "0.000") {
            this.byId("stInCPC5").setValue(objArmados.zcpc.zcpc6_5Value);
            this.byId("frmElmCPC5").setVisible(true);
          }
          if (objArmados.zcpc.zcpc6_6Value != "0.000") {
            this.byId("stInCPC6").setValue(objArmados.zcpc.zcpc6_6Value);
            this.byId("frmElmCPC6").setVisible(true);
          }
          if (objArmados.zcpc.zcpc6_7Value != "0.000") {
            this.byId("stInCPC7").setValue(objArmados.zcpc.zcpc6_7Value);
            this.byId("frmElmCPC7").setVisible(true);
          }
          if (objArmados.zcpc.zcpc6_8Value != "0.000") {
            this.byId("stInCPC8").setValue(objArmados.zcpc.zcpc6_8Value);
            this.byId("frmElmCPC8").setVisible(true);
          }
          if (objArmados.zcpc.zcpc6_9Value != "0.000") {
            this.byId("stInCPC9").setValue(objArmados.zcpc.zcpc6_9Value);
            this.byId("frmElmCPC9").setVisible(true);
          }
          break;
        case objArmados.zcpp.zcpp7Desc:
          if (objArmados.zcpc.zcpc7_1Value != "0.000") {
            this.byId("stInCPC1").setValue(objArmados.zcpc.zcpc7_1Value);
            this.byId("frmElmCPC1").setVisible(true);
          }
          if (objArmados.zcpc.zcpc7_2Value != "0.000") {
            this.byId("stInCPC2").setValue(objArmados.zcpc.zcpc7_2Value);
            this.byId("frmElmCPC2").setVisible(true);
          }
          if (objArmados.zcpc.zcpc7_3Value != "0.000") {
            this.byId("stInCPC3").setValue(objArmados.zcpc.zcpc7_3Value);
            this.byId("frmElmCPC3").setVisible(true);
          }
          if (objArmados.zcpc.zcpc7_4Value != "0.000") {
            this.byId("stInCPC4").setValue(objArmados.zcpc.zcpc7_4Value);
            this.byId("frmElmCPC4").setVisible(true);
          }
          if (objArmados.zcpc.zcpc7_5Value != "0.000") {
            this.byId("stInCPC5").setValue(objArmados.zcpc.zcpc7_5Value);
            this.byId("frmElmCPC5").setVisible(true);
          }
          if (objArmados.zcpc.zcpc7_6Value != "0.000") {
            this.byId("stInCPC6").setValue(objArmados.zcpc.zcpc7_6Value);
            this.byId("frmElmCPC6").setVisible(true);
          }
          if (objArmados.zcpc.zcpc7_7Value != "0.000") {
            this.byId("stInCPC7").setValue(objArmados.zcpc.zcpc7_7Value);
            this.byId("frmElmCPC7").setVisible(true);
          }
          if (objArmados.zcpc.zcpc7_8Value != "0.000") {
            this.byId("stInCPC8").setValue(objArmados.zcpc.zcpc7_8Value);
            this.byId("frmElmCPC8").setVisible(true);
          }
          if (objArmados.zcpc.zcpc7_9Value != "0.000") {
            this.byId("stInCPC9").setValue(objArmados.zcpc.zcpc7_9Value);
            this.byId("frmElmCPC9").setVisible(true);
          }
          break;
        case objArmados.zcpp.zcpp8Desc:
          if (objArmados.zcpc.zcpc8_1Value != "0.000") {
            this.byId("stInCPC1").setValue(objArmados.zcpc.zcpc8_1Value);
            this.byId("frmElmCPC1").setVisible(true);
          }
          if (objArmados.zcpc.zcpc8_2Value != "0.000") {
            this.byId("stInCPC2").setValue(objArmados.zcpc.zcpc8_2Value);
            this.byId("frmElmCPC2").setVisible(true);
          }
          if (objArmados.zcpc.zcpc8_3Value != "0.000") {
            this.byId("stInCPC3").setValue(objArmados.zcpc.zcpc8_3Value);
            this.byId("frmElmCPC3").setVisible(true);
          }
          if (objArmados.zcpc.zcpc8_4Value != "0.000") {
            this.byId("stInCPC4").setValue(objArmados.zcpc.zcpc8_4Value);
            this.byId("frmElmCPC4").setVisible(true);
          }
          if (objArmados.zcpc.zcpc8_5Value != "0.000") {
            this.byId("stInCPC5").setValue(objArmados.zcpc.zcpc8_5Value);
            this.byId("frmElmCPC5").setVisible(true);
          }
          if (objArmados.zcpc.zcpc8_6Value != "0.000") {
            this.byId("stInCPC6").setValue(objArmados.zcpc.zcpc8_6Value);
            this.byId("frmElmCPC6").setVisible(true);
          }
          if (objArmados.zcpc.zcpc8_7Value != "0.000") {
            this.byId("stInCPC7").setValue(objArmados.zcpc.zcpc8_7Value);
            this.byId("frmElmCPC7").setVisible(true);
          }
          if (objArmados.zcpc.zcpc8_8Value != "0.000") {
            this.byId("stInCPC8").setValue(objArmados.zcpc.zcpc8_8Value);
            this.byId("frmElmCPC8").setVisible(true);
          }
          if (objArmados.zcpc.zcpc8_9Value != "0.000") {
            this.byId("stInCPC9").setValue(objArmados.zcpc.zcpc8_9Value);
            this.byId("frmElmCPC9").setVisible(true);
          }
          break;
        case objArmados.zcpp.zcpp9Desc:
          if (objArmados.zcpc.zcpc9_1Value != "0.000") {
            this.byId("stInCPC1").setValue(objArmados.zcpc.zcpc9_1Value);
            this.byId("frmElmCPC1").setVisible(true);
          }
          if (objArmados.zcpc.zcpc9_2Value != "0.000") {
            this.byId("stInCPC2").setValue(objArmados.zcpc.zcpc9_2Value);
            this.byId("frmElmCPC2").setVisible(true);
          }
          if (objArmados.zcpc.zcpc9_3Value != "0.000") {
            this.byId("stInCPC3").setValue(objArmados.zcpc.zcpc9_3Value);
            this.byId("frmElmCPC3").setVisible(true);
          }
          if (objArmados.zcpc.zcpc9_4Value != "0.000") {
            this.byId("stInCPC4").setValue(objArmados.zcpc.zcpc9_4Value);
            this.byId("frmElmCPC4").setVisible(true);
          }
          if (objArmados.zcpc.zcpc9_5Value != "0.000") {
            this.byId("stInCPC5").setValue(objArmados.zcpc.zcpc9_5Value);
            this.byId("frmElmCPC5").setVisible(true);
          }
          if (objArmados.zcpc.zcpc9_6Value != "0.000") {
            this.byId("stInCPC6").setValue(objArmados.zcpc.zcpc9_6Value);
            this.byId("frmElmCPC6").setVisible(true);
          }
          if (objArmados.zcpc.zcpc9_7Value != "0.000") {
            this.byId("stInCPC7").setValue(objArmados.zcpc.zcpc9_7Value);
            this.byId("frmElmCPC7").setVisible(true);
          }
          if (objArmados.zcpc.zcpc9_8Value != "0.000") {
            this.byId("stInCPC8").setValue(objArmados.zcpc.zcpc9_8Value);
            this.byId("frmElmCPC8").setVisible(true);
          }
          if (objArmados.zcpc.zcpc9_9Value != "0.000") {
            this.byId("stInCPC9").setValue(objArmados.zcpc.zcpc9_9Value);
            this.byId("frmElmCPC9").setVisible(true);
          }
          break;
        default: MessageBox.show("Armado ZCPP no reconocido",
          MessageBox.Icon.WARNING, "Advertencia");
      }
    },

    cleanAndHideAll: function () {
      this.byId("frmElmCPP").setVisible(false);
      this.byId("stInCPP").setValue(null);
      this.byId("lblCPP").setText("Camas por Pallet #");

      for (let i = 1; i < 10; i++) {
        this.byId("frmElmCPC" + i).setVisible(false);
        this.byId("stInPPC" + i).setValue("0.000");
        this.byId("frmElmPPC" + i).setVisible(false);
      }
      this.loadZPPC();

    },

    loadZPPC: function () {
      try {
        let objArmados = this.rowDialogTable;
        if (this.rowDialogTable == null || this.rowDialogTable == undefined) {
          this.byId("btnAddZPPC").setEnabled(false);
          this.byId("btnEditZPPC").setEnabled(false);
          return;
        }
        let visible = 0;

        if (objArmados.zppc.zppc1Value != "0.000") {
          this.byId("stInPPC1").setValue(objArmados.zppc.zppc1Value);
          this.byId("frmElmPPC1").setVisible(true);
          visible++;
        }
        if (objArmados.zppc.zppc2Value != "0.000") {
          this.byId("stInPPC2").setValue(objArmados.zppc.zppc2Value);
          this.byId("frmElmPPC2").setVisible(true);
          visible++;
        }
        if (objArmados.zppc.zppc3Value != "0.000") {
          this.byId("stInPPC3").setValue(objArmados.zppc.zppc3Value);
          this.byId("frmElmPPC3").setVisible(true);
          visible++;
        }
        if (objArmados.zppc.zppc4Value != "0.000") {
          this.byId("stInPPC4").setValue(objArmados.zppc.zppc4Value);
          this.byId("frmElmPPC4").setVisible(true);
          visible++;
        }
        if (objArmados.zppc.zppc5Value != "0.000") {
          this.byId("stInPPC5").setValue(objArmados.zppc.zppc5Value);
          this.byId("frmElmPPC5").setVisible(true);
          visible++;
        }
        if (objArmados.zppc.zppc6Value != "0.000") {
          this.byId("stInPPC6").setValue(objArmados.zppc.zppc6Value);
          this.byId("frmElmPPC6").setVisible(true);
          visible++;
        }
        if (objArmados.zppc.zppc7Value != "0.000") {
          this.byId("stInPPC7").setValue(objArmados.zppc.zppc7Value);
          this.byId("frmElmPPC7").setVisible(true);
          visible++;
        }
        if (objArmados.zppc.zppc8Value != "0.000") {
          this.byId("stInPPC8").setValue(objArmados.zppc.zppc8Value);
          this.byId("frmElmPPC8").setVisible(true);
          visible++;
        }
        if (objArmados.zppc.zppc9Value != "0.000") {
          this.byId("stInPPC9").setValue(objArmados.zppc.zppc9Value);
          this.byId("frmElmPPC9").setVisible(true);
          visible++;
        }

        if (visible == 0) {
          this.byId("btnAddZPPC").setEnabled(true);
          this.byId("btnEditZPPC").setEnabled(false);
        } else if (visible > 0 && visible < 9) {
          this.byId("btnAddZPPC").setEnabled(true);
          this.byId("btnEditZPPC").setEnabled(true);
        } else if (visible == 9) {
          this.byId("btnAddZPPC").setEnabled(false);
          this.byId("btnEditZPPC").setEnabled(true);
        }


      } catch (e) {
        console.warn("Material sin ZPPC (piezas por caja)");
      }

    },

    frgById:function(id){
      return Fragment.byId(this.getView().getId(), id);
  },
    _onValueHelpMatnr: function () {
      BusyIndicator.show(0);
      // create value help dialog
      let oView = this.getView();
      if (!this.byId("searchHelpTablePopUp")) {

          Fragment.load({
              id: oView.getId(),
              name: "com.bmore.inveweb.view.fragments.DialogMatnr",
              controller: this
            }).then(function(oDialog){
              oView.addDependent(oDialog);
              this.frgById("keyTitle").setText("Material");
              this.frgById("textTitle").setText("Descripción");
              if (Device.system.desktop) {
                oDialog.addStyleClass("sapUiSizeCompact");
              }
              oDialog.setTitle("Seleccionar material");
              this.frgById("dialogTable").removeSelections(true);
              this.dialogTableModel.setProperty("/", this.systemClassData);
              this.getView().getModel("dialogTableModel").refresh(true);
              this.frgById("srchFieldDialog").fireLiveChange();
              oDialog.open();
            }.bind(this));
      }else{
        this.frgById("dialogTable").removeSelections(true);
        this.dialogTableModel.setProperty("/", this.systemClassData);
        this.getView().getModel("dialogTableModel").refresh(true);
        // open value help dialog
        this.frgById("srchFieldDialog").fireLiveChange();
          this.byId("searchHelpTablePopUp").open();
      }
      BusyIndicator.hide();
    },

    _dialogMatnrClose: function () {
      this.frgById("srchFieldDialog").setValue("");
      this.byId("searchHelpTablePopUp").close();
    },

    _selectRowTable: function (oEvent) {
      this.rowDialogTable = this.getView().getModel("dialogTableModel").
        getProperty(oEvent.getSource().getBinding("items").
          getContexts()[oEvent.getSource().
            indexOfItem(oEvent.getParameters().listItem)].sPath);
      this.rowOriginal = this.copyObjToNew(this.rowDialogTable);

      this.byId("inputSelectMatnr").setValue(this.rowDialogTable.matnr + " - " + this.rowDialogTable.maktx);
      this.byId("inputSelectMatnr").setTooltip(this.rowDialogTable.matnr + " - " + this.rowDialogTable.maktx);
      this.frgById("srchFieldDialog").setValue("");
      this._dialogMatnrClose();
      this.onChangeMatnr();
    },

    _onSearchCSCDialog: function (oEvent) {
      let sQuery = oEvent.getSource().getValue().trim();
      let oFilter = new Filter({
        filters: [

          new Filter("matnr", FilterOperator.Contains, sQuery),
          new Filter("maktx", FilterOperator.Contains, sQuery)
        ],
        and: false
      });
      let oBinding = this.frgById("dialogTable").getBinding("items");
      oBinding.filter(oFilter, FilterType.Application);
    },

    configureAddRemoveBtnsZCPP: function () {
      let zcppSize = this.byId("cmbxArmados").getItems().length;
      if (zcppSize == 0) {
        this.byId("btnAddZCPP").setEnabled(true);
      } else if (zcppSize > 0 && zcppSize < 9) {
        this.byId("btnAddZCPP").setEnabled(true);
      } else if (zcppSize == 9) {
        this.byId("btnAddZCPP").setEnabled(false);
      }
    },

    onAddMatnr: function () {
      let that = this;
      let oView = this.getView();
      if (!this.byId("addArmadoPopUp")) {

          Fragment.load({
              id: oView.getId(),
              name: "com.bmore.inveweb.view.fragments.DialogAddArmado",
              controller: this
            }).then(function(oDialog){
              oView.addDependent(oDialog);
              if (Device.system.desktop) {
                oDialog.addStyleClass("sapUiSizeCompact");
              }
              oDialog.setTitle("Agregar material");
              this.frgById("frgFormValidateMatnr").setVisible(true);
              this.frgById("frgFormArmadoMatnr").setVisible(false);
              this.frgById("frgFormPPC").setVisible(false);
              this.frgById("frgBtnSaveDialogArmado").setVisible(false);
              this.frgById("frgCmbxArmados").setEditable(true);
              this.frgById("frgInputValidateMatnr").setValue("");
        
              let input = this.frgById("frgInputValidateMatnr");
        
              input.attachBrowserEvent("keypress", function (evt) {
        
                if (evt.keyCode == 13) {
                  setTimeout(function () {
                    that._onValidateMatnr();
                  }, 100);
                }
              });
              oDialog.open();
            }.bind(this));
      }else{
              this.byId("addArmadoPopUp").setTitle("Agregar material");
              this.frgById("frgFormValidateMatnr").setVisible(true);
              this.frgById("frgFormArmadoMatnr").setVisible(false);
              this.frgById("frgFormPPC").setVisible(false);
              this.frgById("frgBtnSaveDialogArmado").setVisible(false);
              this.frgById("frgCmbxArmados").setEditable(true);
              this.frgById("frgInputValidateMatnr").setValue("");
        
              let input = this.frgById("frgInputValidateMatnr");
        
              input.attachBrowserEvent("keypress", function (evt) {
        
                if (evt.keyCode == 13) {
                  setTimeout(function () {
                    that._onValidateMatnr();
                  }, 100);
                }
              });
          this.byId("addArmadoPopUp").open();
      }
      
    },

    _onValidateMatnr: function () {
      let systemClass = this.systemClassData;
      let altaMatnr = this.frgById("frgInputValidateMatnr").getValue().trim();
      if (altaMatnr == "" || altaMatnr == " ") {
        MessageBox.show("El campo no puede estar vacío",
          MessageBox.Icon.ERROR, "Ingrese material");
        return;
      }
      for (let i in systemClass) {
        if (systemClass[i].matnr == altaMatnr) {
          MessageBox.show("Ya existe el material " + altaMatnr + " en el sistema de clasificación",
            MessageBox.Icon.WARNING, "Material ya existente");
          return;
        }
      }
      this.validateMatnr([{ matnr: altaMatnr }]);
    },

    onAddZcpp: function () {
      this.backupRowTable = this.copyObjToNew(this.rowDialogTable);
      let oView = this.getView();
      if (!this.byId("addArmadoPopUp")) {

          Fragment.load({
              id: oView.getId(),
              name: "com.bmore.inveweb.view.fragments.DialogAddArmado",
              controller: this
            }).then(function(oDialog){
              oView.addDependent(oDialog);
              if (Device.system.desktop) {
                oDialog.addStyleClass("sapUiSizeCompact");
              }
              oDialog.setTitle("Agregar armado");
              this.frgById("frgFormValidateMatnr").setVisible(false);
              this.frgById("frgFormArmadoMatnr").setVisible(true);
              this.frgById("frgFormPPC").setVisible(false);
              if (this.byId("inputSelectMatnr").getValue() && this.byId("btnAddZCPP").getEnabled()) {
                this.frgById("frgBtnSaveDialogArmado").setVisible(true);
              }
        
              this.modelAltaArmados.setProperty("/", this.rowDialogTable);
        
              let objArm = this.rowDialogTable;
              let listZero = this.getZcppsInZero(objArm.zcpp);
              this.nuevoArmadoDesc = listZero[0];
              this.frgById("frgInputMatnr").setValue(this.rowDialogTable.matnr + " - " + this.rowDialogTable.maktx);
              this.frgById("frgCmbxArmados").setSelectedKey(this.nuevoArmadoDesc);
              this.frgById("frgCmbxArmados").setEditable(false);
              this.frgById("frgCmbxArmados").fireChange();
              oDialog.open();
            }.bind(this));
      }else{
        this.byId("addArmadoPopUp").setTitle("Agregar armado");
        this.frgById("frgFormValidateMatnr").setVisible(false);
        this.frgById("frgFormArmadoMatnr").setVisible(true);
        this.frgById("frgFormPPC").setVisible(false);
        if (this.byId("inputSelectMatnr").getValue() && this.byId("btnAddZCPP").getEnabled()) {
          this.frgById("frgBtnSaveDialogArmado").setVisible(true);
        }
  
        this.modelAltaArmados.setProperty("/", this.rowDialogTable);
  
        let objArm = this.rowDialogTable;
        let listZero = this.getZcppsInZero(objArm.zcpp);
        this.nuevoArmadoDesc = listZero[0];
        this.frgById("frgInputMatnr").setValue(this.rowDialogTable.matnr + " - " + this.rowDialogTable.maktx);
        this.frgById("frgCmbxArmados").setSelectedKey(this.nuevoArmadoDesc);
        this.frgById("frgCmbxArmados").setEditable(false);
        this.frgById("frgCmbxArmados").fireChange();
          this.byId("addArmadoPopUp").open();
      }

    },

    getPositionsValuesZCPC: function (zcppDesc, modelData) {
      let listZCPCValues = [];
      let objArmados = this.rowDialogTable;
      switch (zcppDesc) {
        case objArmados.zcpp.zcpp1Desc:
          listZCPCValues.push(modelData.zcpc.zcpc1_1Value);
          listZCPCValues.push(modelData.zcpc.zcpc1_2Value);
          listZCPCValues.push(modelData.zcpc.zcpc1_3Value);
          listZCPCValues.push(modelData.zcpc.zcpc1_4Value);
          listZCPCValues.push(modelData.zcpc.zcpc1_5Value);
          listZCPCValues.push(modelData.zcpc.zcpc1_6Value);
          listZCPCValues.push(modelData.zcpc.zcpc1_7Value);
          listZCPCValues.push(modelData.zcpc.zcpc1_8Value);
          listZCPCValues.push(modelData.zcpc.zcpc1_9Value);
          break;
        case objArmados.zcpp.zcpp2Desc:
          listZCPCValues.push(modelData.zcpc.zcpc2_1Value);
          listZCPCValues.push(modelData.zcpc.zcpc2_2Value);
          listZCPCValues.push(modelData.zcpc.zcpc2_3Value);
          listZCPCValues.push(modelData.zcpc.zcpc2_4Value);
          listZCPCValues.push(modelData.zcpc.zcpc2_5Value);
          listZCPCValues.push(modelData.zcpc.zcpc2_6Value);
          listZCPCValues.push(modelData.zcpc.zcpc2_7Value);
          listZCPCValues.push(modelData.zcpc.zcpc2_8Value);
          listZCPCValues.push(modelData.zcpc.zcpc2_9Value);
          break;
        case objArmados.zcpp.zcpp3Desc:
          listZCPCValues.push(modelData.zcpc.zcpc3_1Value);
          listZCPCValues.push(modelData.zcpc.zcpc3_2Value);
          listZCPCValues.push(modelData.zcpc.zcpc3_3Value);
          listZCPCValues.push(modelData.zcpc.zcpc3_4Value);
          listZCPCValues.push(modelData.zcpc.zcpc3_5Value);
          listZCPCValues.push(modelData.zcpc.zcpc3_6Value);
          listZCPCValues.push(modelData.zcpc.zcpc3_7Value);
          listZCPCValues.push(modelData.zcpc.zcpc3_8Value);
          listZCPCValues.push(modelData.zcpc.zcpc3_9Value);
          break;
        case objArmados.zcpp.zcpp4Desc:
          listZCPCValues.push(modelData.zcpc.zcpc4_1Value);
          listZCPCValues.push(modelData.zcpc.zcpc4_2Value);
          listZCPCValues.push(modelData.zcpc.zcpc4_3Value);
          listZCPCValues.push(modelData.zcpc.zcpc4_4Value);
          listZCPCValues.push(modelData.zcpc.zcpc4_5Value);
          listZCPCValues.push(modelData.zcpc.zcpc4_6Value);
          listZCPCValues.push(modelData.zcpc.zcpc4_7Value);
          listZCPCValues.push(modelData.zcpc.zcpc4_8Value);
          listZCPCValues.push(modelData.zcpc.zcpc4_9Value);
          break;
        case objArmados.zcpp.zcpp5Desc:
          listZCPCValues.push(modelData.zcpc.zcpc5_1Value);
          listZCPCValues.push(modelData.zcpc.zcpc5_2Value);
          listZCPCValues.push(modelData.zcpc.zcpc5_3Value);
          listZCPCValues.push(modelData.zcpc.zcpc5_4Value);
          listZCPCValues.push(modelData.zcpc.zcpc5_5Value);
          listZCPCValues.push(modelData.zcpc.zcpc5_6Value);
          listZCPCValues.push(modelData.zcpc.zcpc5_7Value);
          listZCPCValues.push(modelData.zcpc.zcpc5_8Value);
          listZCPCValues.push(modelData.zcpc.zcpc5_9Value);
          break;
        case objArmados.zcpp.zcpp6Desc:
          listZCPCValues.push(modelData.zcpc.zcpc6_1Value);
          listZCPCValues.push(modelData.zcpc.zcpc6_2Value);
          listZCPCValues.push(modelData.zcpc.zcpc6_3Value);
          listZCPCValues.push(modelData.zcpc.zcpc6_4Value);
          listZCPCValues.push(modelData.zcpc.zcpc6_5Value);
          listZCPCValues.push(modelData.zcpc.zcpc6_6Value);
          listZCPCValues.push(modelData.zcpc.zcpc6_7Value);
          listZCPCValues.push(modelData.zcpc.zcpc6_8Value);
          listZCPCValues.push(modelData.zcpc.zcpc6_9Value);
          break;
        case objArmados.zcpp.zcpp7Desc:
          listZCPCValues.push(modelData.zcpc.zcpc7_1Value);
          listZCPCValues.push(modelData.zcpc.zcpc7_2Value);
          listZCPCValues.push(modelData.zcpc.zcpc7_3Value);
          listZCPCValues.push(modelData.zcpc.zcpc7_4Value);
          listZCPCValues.push(modelData.zcpc.zcpc7_5Value);
          listZCPCValues.push(modelData.zcpc.zcpc7_6Value);
          listZCPCValues.push(modelData.zcpc.zcpc7_7Value);
          listZCPCValues.push(modelData.zcpc.zcpc7_8Value);
          listZCPCValues.push(modelData.zcpc.zcpc7_9Value);
          break;
        case objArmados.zcpp.zcpp8Desc:
          listZCPCValues.push(modelData.zcpc.zcpc8_1Value);
          listZCPCValues.push(modelData.zcpc.zcpc8_2Value);
          listZCPCValues.push(modelData.zcpc.zcpc8_3Value);
          listZCPCValues.push(modelData.zcpc.zcpc8_4Value);
          listZCPCValues.push(modelData.zcpc.zcpc8_5Value);
          listZCPCValues.push(modelData.zcpc.zcpc8_6Value);
          listZCPCValues.push(modelData.zcpc.zcpc8_7Value);
          listZCPCValues.push(modelData.zcpc.zcpc8_8Value);
          listZCPCValues.push(modelData.zcpc.zcpc8_9Value);
          break;
        case objArmados.zcpp.zcpp9Desc:
          listZCPCValues.push(modelData.zcpc.zcpc9_1Value);
          listZCPCValues.push(modelData.zcpc.zcpc9_2Value);
          listZCPCValues.push(modelData.zcpc.zcpc9_3Value);
          listZCPCValues.push(modelData.zcpc.zcpc9_4Value);
          listZCPCValues.push(modelData.zcpc.zcpc9_5Value);
          listZCPCValues.push(modelData.zcpc.zcpc9_6Value);
          listZCPCValues.push(modelData.zcpc.zcpc9_7Value);
          listZCPCValues.push(modelData.zcpc.zcpc9_8Value);
          listZCPCValues.push(modelData.zcpc.zcpc9_9Value);
          break;
      }
      return listZCPCValues;
    },

    _dialogAddArmadoSave: function () {
      let modelData = this.getView().getModel("modelAltaArmados").getData();

      if (this.byId("addArmadoPopUp").getTitle() == "Agregar armado") {
        let listZCPCValues = this.getPositionsValuesZCPC(this.nuevoArmadoDesc, modelData);
        let listZcpc = [];
        let zcpp = this.getZcppsValueByDesc(modelData.zcpp, this.nuevoArmadoDesc);
        let zcpc1 = listZCPCValues[0];
        listZcpc.push(zcpc1);
        let zcpc2 = listZCPCValues[1];
        listZcpc.push(zcpc2);
        let zcpc3 = listZCPCValues[2];
        listZcpc.push(zcpc3);
        let zcpc4 = listZCPCValues[3];
        listZcpc.push(zcpc4);
        let zcpc5 = listZCPCValues[4];
        listZcpc.push(zcpc5);
        let zcpc6 = listZCPCValues[5];
        listZcpc.push(zcpc6);
        let zcpc7 = listZCPCValues[6];
        listZcpc.push(zcpc7);
        let zcpc8 = listZCPCValues[7];
        listZcpc.push(zcpc8);
        let zcpc9 = listZCPCValues[8];
        listZcpc.push(zcpc9);

        if (zcpp == 0) {
          MessageBox.show("Debe asignar un valor mayor a cero para ''" + this.nuevoArmadoDesc + "''",
            MessageBox.Icon.ERROR, "Datos de pallet incorrectos");
          return;
        }
        if (zcpc1 == 0 && zcpc2 == 0 && zcpc3 == 0
          && zcpc4 == 0 && zcpc5 == 0 && zcpc6 == 0
          && zcpc7 == 0 && zcpc8 == 0 && zcpc9 == 0) {
          MessageBox.show("Por lo menos una 'Camas por Caja' debe ser mayor a cero",
            MessageBox.Icon.ERROR, "Datos de camas incorrectos");
          return;
        }
        let zcppsValues = this.getZcppsWithValue(this.rowDialogTable.zcpp);
        if (zcppsValues.length > 0) {
          for (let i in zcppsValues) {
            let value = this.getZcppsValueByDesc(this.rowDialogTable.zcpp, zcppsValues[i]);
            if (value == zcpp && this.nuevoArmadoDesc != zcppsValues[i]) {
              MessageBox.show("El valor '" + zcpp + "' asigando para '" + this.nuevoArmadoDesc + "' ya existe en '" + zcppsValues[i] + "'\n Favor de asignar un valor diferente",
                MessageBox.Icon.ERROR, "Datos incorrectos");
              return;
            }
          }
        }

        if (this.setArmadosByZcppDesc(this.rowDialogTable, this.nuevoArmadoDesc, zcpp, listZcpc)) {
          BusyIndicator.show(0);
          this.execSetArmadosInve([this.rowDialogTable], "Agregar armado");
          //Ingresar el nuevo armado al combo
          this.generateItem(this.byId("cmbxArmados"), this.nuevoArmadoDesc, this.nuevoArmadoDesc, this.nuevoArmadoDesc, true);
        } else {
          MessageBox.show("Error al procesar la información",
            MessageBox.Icon.ERROR, "Armado incorrecto");
        }
      } else if (this.byId("addArmadoPopUp").getTitle() == "Agregar material") {
        BusyIndicator.show(0);
        this.execSetArmadosInve([modelData], "Agregar material");
      }

    },

    _dialogAddArmadoClose: function () {
      if (this.backupRowTable) {
        this.rowDialogTable = this.copyObjToNew(this.backupRowTable);
      }

      this.Edited = false;
      this.byId("addArmadoPopUp").close();
    },

    getZcppsInZero: function (zcpp) {
      let listZcppZero = [];
      if (zcpp.zcpp1Value == "0.000") {
        listZcppZero.push(zcpp.zcpp1Desc);
      }
      if (zcpp.zcpp2Value == "0.000") {
        listZcppZero.push(zcpp.zcpp2Desc);
      }
      if (zcpp.zcpp3Value == "0.000") {
        listZcppZero.push(zcpp.zcpp3Desc);
      }
      if (zcpp.zcpp4Value == "0.000") {
        listZcppZero.push(zcpp.zcpp4Desc);
      }
      if (zcpp.zcpp5Value == "0.000") {
        listZcppZero.push(zcpp.zcpp5Desc);
      }
      if (zcpp.zcpp6Value == "0.000") {
        listZcppZero.push(zcpp.zcpp6Desc);
      }
      if (zcpp.zcpp7Value == "0.000") {
        listZcppZero.push(zcpp.zcpp7Desc);
      }
      if (zcpp.zcpp8Value == "0.000") {
        listZcppZero.push(zcpp.zcpp8Desc);
      }
      if (zcpp.zcpp9Value == "0.000") {
        listZcppZero.push(zcpp.zcpp9Desc);
      }

      return listZcppZero;
    },

    getZcppsWithValue: function (zcpp) {
      let listZcppValue = [];
      if (zcpp.zcpp1Value != "0.000") {
        listZcppValue.push(zcpp.zcpp1Desc);
      }
      if (zcpp.zcpp2Value != "0.000") {
        listZcppValue.push(zcpp.zcpp2Desc);
      }
      if (zcpp.zcpp3Value != "0.000") {
        listZcppValue.push(zcpp.zcpp3Desc);
      }
      if (zcpp.zcpp4Value != "0.000") {
        listZcppValue.push(zcpp.zcpp4Desc);
      }
      if (zcpp.zcpp5Value != "0.000") {
        listZcppValue.push(zcpp.zcpp5Desc);
      }
      if (zcpp.zcpp6Value != "0.000") {
        listZcppValue.push(zcpp.zcpp6Desc);
      }
      if (zcpp.zcpp7Value != "0.000") {
        listZcppValue.push(zcpp.zcpp7Desc);
      }
      if (zcpp.zcpp8Value != "0.000") {
        listZcppValue.push(zcpp.zcpp8Desc);
      }
      if (zcpp.zcpp9Value != "0.000") {
        listZcppValue.push(zcpp.zcpp9Desc);
      }

      return listZcppValue;
    },

    getZcppsValueByDesc: function (zcpp, desc) {
      let map = new Map();
      map.set(zcpp.zcpp1Desc, zcpp.zcpp1Value);
      map.set(zcpp.zcpp2Desc, zcpp.zcpp2Value);
      map.set(zcpp.zcpp3Desc, zcpp.zcpp3Value);
      map.set(zcpp.zcpp4Desc, zcpp.zcpp4Value);
      map.set(zcpp.zcpp5Desc, zcpp.zcpp5Value);
      map.set(zcpp.zcpp6Desc, zcpp.zcpp6Value);
      map.set(zcpp.zcpp7Desc, zcpp.zcpp7Value);
      map.set(zcpp.zcpp8Desc, zcpp.zcpp8Value);
      map.set(zcpp.zcpp9Desc, zcpp.zcpp9Value);

      return map.get(desc);
    },

    setArmadosByZcppDesc: function (objArmados, zcppDesc, zcpp, listZcpc) {
      let flag = false;
      switch (zcppDesc) {
        case objArmados.zcpp.zcpp1Desc:
          objArmados.zcpp.zcpp1Value = this.setFormat(3, zcpp);
          objArmados.zcpc.zcpc1_1Value = this.setFormat(3, listZcpc[0]);
          objArmados.zcpc.zcpc1_2Value = this.setFormat(3, listZcpc[1]);
          objArmados.zcpc.zcpc1_3Value = this.setFormat(3, listZcpc[2]);
          objArmados.zcpc.zcpc1_4Value = this.setFormat(3, listZcpc[3]);
          objArmados.zcpc.zcpc1_5Value = this.setFormat(3, listZcpc[4]);
          objArmados.zcpc.zcpc1_6Value = this.setFormat(3, listZcpc[5]);
          objArmados.zcpc.zcpc1_7Value = this.setFormat(3, listZcpc[6]);
          objArmados.zcpc.zcpc1_8Value = this.setFormat(3, listZcpc[7]);
          objArmados.zcpc.zcpc1_9Value = this.setFormat(3, listZcpc[8]);
          flag = true;
          break;
        case objArmados.zcpp.zcpp2Desc:
          objArmados.zcpp.zcpp2Value = this.setFormat(3, zcpp);
          objArmados.zcpc.zcpc2_1Value = this.setFormat(3, listZcpc[0]);
          objArmados.zcpc.zcpc2_2Value = this.setFormat(3, listZcpc[1]);
          objArmados.zcpc.zcpc2_3Value = this.setFormat(3, listZcpc[2]);
          objArmados.zcpc.zcpc2_4Value = this.setFormat(3, listZcpc[3]);
          objArmados.zcpc.zcpc2_5Value = this.setFormat(3, listZcpc[4]);
          objArmados.zcpc.zcpc2_6Value = this.setFormat(3, listZcpc[5]);
          objArmados.zcpc.zcpc2_7Value = this.setFormat(3, listZcpc[6]);
          objArmados.zcpc.zcpc2_8Value = this.setFormat(3, listZcpc[7]);
          objArmados.zcpc.zcpc2_9Value = this.setFormat(3, listZcpc[8]);
          flag = true;
          break;
        case objArmados.zcpp.zcpp3Desc:
          objArmados.zcpp.zcpp3Value = zcpp;
          objArmados.zcpc.zcpc3_1Value = this.setFormat(3, listZcpc[0]);
          objArmados.zcpc.zcpc3_2Value = this.setFormat(3, listZcpc[1]);
          objArmados.zcpc.zcpc3_3Value = this.setFormat(3, listZcpc[2]);
          objArmados.zcpc.zcpc3_4Value = this.setFormat(3, listZcpc[3]);
          objArmados.zcpc.zcpc3_5Value = this.setFormat(3, listZcpc[4]);
          objArmados.zcpc.zcpc3_6Value = this.setFormat(3, listZcpc[5]);
          objArmados.zcpc.zcpc3_7Value = this.setFormat(3, listZcpc[6]);
          objArmados.zcpc.zcpc3_8Value = this.setFormat(3, listZcpc[7]);
          objArmados.zcpc.zcpc3_9Value = this.setFormat(3, listZcpc[8]);
          flag = true;
          break;
        case objArmados.zcpp.zcpp4Desc:
          objArmados.zcpp.zcpp4Value = zcpp;
          objArmados.zcpc.zcpc4_1Value = this.setFormat(3, listZcpc[0]);
          objArmados.zcpc.zcpc4_2Value = this.setFormat(3, listZcpc[1]);
          objArmados.zcpc.zcpc4_3Value = this.setFormat(3, listZcpc[2]);
          objArmados.zcpc.zcpc4_4Value = this.setFormat(3, listZcpc[3]);
          objArmados.zcpc.zcpc4_5Value = this.setFormat(3, listZcpc[4]);
          objArmados.zcpc.zcpc4_6Value = this.setFormat(3, listZcpc[5]);
          objArmados.zcpc.zcpc4_7Value = this.setFormat(3, listZcpc[6]);
          objArmados.zcpc.zcpc4_8Value = this.setFormat(3, listZcpc[7]);
          objArmados.zcpc.zcpc4_9Value = this.setFormat(3, listZcpc[8]);
          flag = true;
          break;
        case objArmados.zcpp.zcpp5Desc:
          objArmados.zcpp.zcpp5Value = zcpp;
          objArmados.zcpc.zcpc5_1Value = this.setFormat(3, listZcpc[0]);
          objArmados.zcpc.zcpc5_2Value = this.setFormat(3, listZcpc[1]);
          objArmados.zcpc.zcpc5_3Value = this.setFormat(3, listZcpc[2]);
          objArmados.zcpc.zcpc5_4Value = this.setFormat(3, listZcpc[3]);
          objArmados.zcpc.zcpc5_5Value = this.setFormat(3, listZcpc[4]);
          objArmados.zcpc.zcpc5_6Value = this.setFormat(3, listZcpc[5]);
          objArmados.zcpc.zcpc5_7Value = this.setFormat(3, listZcpc[6]);
          objArmados.zcpc.zcpc5_8Value = this.setFormat(3, listZcpc[7]);
          objArmados.zcpc.zcpc5_9Value = this.setFormat(3, listZcpc[8]);
          flag = true;
          break;
        case objArmados.zcpp.zcpp6Desc:
          objArmados.zcpp.zcpp6Value = zcpp;
          objArmados.zcpc.zcpc6_1Value = this.setFormat(3, listZcpc[0]);
          objArmados.zcpc.zcpc6_2Value = this.setFormat(3, listZcpc[1]);
          objArmados.zcpc.zcpc6_3Value = this.setFormat(3, listZcpc[2]);
          objArmados.zcpc.zcpc6_4Value = this.setFormat(3, listZcpc[3]);
          objArmados.zcpc.zcpc6_5Value = this.setFormat(3, listZcpc[4]);
          objArmados.zcpc.zcpc6_6Value = this.setFormat(3, listZcpc[5]);
          objArmados.zcpc.zcpc6_7Value = this.setFormat(3, listZcpc[6]);
          objArmados.zcpc.zcpc6_8Value = this.setFormat(3, listZcpc[7]);
          objArmados.zcpc.zcpc6_9Value = this.setFormat(3, listZcpc[8]);
          flag = true;
          break;
        case objArmados.zcpp.zcpp7Desc:
          objArmados.zcpp.zcpp7Value = zcpp;
          objArmados.zcpc.zcpc7_1Value = this.setFormat(3, listZcpc[0]);
          objArmados.zcpc.zcpc7_2Value = this.setFormat(3, listZcpc[1]);
          objArmados.zcpc.zcpc7_3Value = this.setFormat(3, listZcpc[2]);
          objArmados.zcpc.zcpc7_4Value = this.setFormat(3, listZcpc[3]);
          objArmados.zcpc.zcpc7_5Value = this.setFormat(3, listZcpc[4]);
          objArmados.zcpc.zcpc7_6Value = this.setFormat(3, listZcpc[5]);
          objArmados.zcpc.zcpc7_7Value = this.setFormat(3, listZcpc[6]);
          objArmados.zcpc.zcpc7_8Value = this.setFormat(3, listZcpc[7]);
          objArmados.zcpc.zcpc7_9Value = this.setFormat(3, listZcpc[8]);
          flag = true;
          break;
        case objArmados.zcpp.zcpp8Desc:
          objArmados.zcpp.zcpp8Value = zcpp;
          objArmados.zcpc.zcpc8_1Value = this.setFormat(3, listZcpc[0]);
          objArmados.zcpc.zcpc8_2Value = this.setFormat(3, listZcpc[1]);
          objArmados.zcpc.zcpc8_3Value = this.setFormat(3, listZcpc[2]);
          objArmados.zcpc.zcpc8_4Value = this.setFormat(3, listZcpc[3]);
          objArmados.zcpc.zcpc8_5Value = this.setFormat(3, listZcpc[4]);
          objArmados.zcpc.zcpc8_6Value = this.setFormat(3, listZcpc[5]);
          objArmados.zcpc.zcpc8_7Value = this.setFormat(3, listZcpc[6]);
          objArmados.zcpc.zcpc8_8Value = this.setFormat(3, listZcpc[7]);
          objArmados.zcpc.zcpc8_9Value = this.setFormat(3, listZcpc[8]);
          flag = true;
          break;
        case objArmados.zcpp.zcpp9Desc:
          objArmados.zcpp.zcpp9Value = zcpp;
          objArmados.zcpc.zcpc9_1Value = this.setFormat(3, listZcpc[0]);
          objArmados.zcpc.zcpc9_2Value = this.setFormat(3, listZcpc[1]);
          objArmados.zcpc.zcpc9_3Value = this.setFormat(3, listZcpc[2]);
          objArmados.zcpc.zcpc9_4Value = this.setFormat(3, listZcpc[3]);
          objArmados.zcpc.zcpc9_5Value = this.setFormat(3, listZcpc[4]);
          objArmados.zcpc.zcpc9_6Value = this.setFormat(3, listZcpc[5]);
          objArmados.zcpc.zcpc9_7Value = this.setFormat(3, listZcpc[6]);
          objArmados.zcpc.zcpc9_8Value = this.setFormat(3, listZcpc[7]);
          objArmados.zcpc.zcpc9_9Value = this.setFormat(3, listZcpc[8]);
          flag = true;
          break;
        default: MessageBox.show("Armado de pallet NO reconocido: " + zcppDesc,
          MessageBox.Icon.ERROR, "ERROR");
      }

      return flag;
    },

    setFormat: function (digits, valor) {
      return new Intl.NumberFormat("en-US", { minimumFractionDigits: digits }).format(valor);
    },

    execGetArmadosInve: async function () {
      const json = await this.execService(InveServices.GET_SYSTEM_CLASS_INV_CIC, {}, "getSystemClassInvCic", this.showLog);

      if (json) {
        BusyIndicator.hide();
        return json.lsObject;

      }
    },

    execSetArmadosInve: async function (armados, title) {
      const request = { tokenObject: null, lsObject: armados };
      const json = await this.execService(InveServices.SET_SYSTEM_CLASS_INV_CIC, request, "setSystemClassInvCic", this.showLog);

      if (json) {

        if (this.byId("addArmadoPopUp")) {
          this.byId("addArmadoPopUp").close();
        }
        if (this.UploadFile) {
          MessageBox.show("Archivo cargado exitosamente\nPuede consultar los nuevos materiales en el tab de Armados",
            { icon: MessageBox.Icon.SUCCESS, title: title, id: "centrado", styleClass: "centrado" });
          this.UploadFile = false;
        } else {
          MessageBox.show("Armado guardado con éxito", MessageBox.Icon.SUCCESS, title);
        }

        this.getArmadosInve();
        return json.lsObject;
      } else {
        if (this.Edited) {
          this.Edited = false;
        }
        if (this.UploadFile) {
          this.UploadFile = false;
        }

        if (this.byId("addArmadoPopUp")) {
          this.byId("addArmadoPopUp").close();
        }
        MessageBox.show("Error al tratar de guardar \n" + json.abstractResult.resultMsgAbs, MessageBox.Icon.ERROR, title);
        return json.abstractResult.resultMsgAbs;
      }

    },

    validateMatnr: async function (matnrList) {
      let validatedList = await this.execValidateMatnr(matnrList);
      let foundMatnr = false;
      let foundObj;
      if (validatedList && validatedList.length > 0) {
        for (let i in validatedList) {
          if (validatedList[i].matnr === String(matnrList[0].matnr)) {
            foundObj = validatedList[i];
            foundMatnr = true;
            break;
          }
        }
      }
      if (foundMatnr) {
        this.Edited = true;
        let altaObj = new Armados(foundObj.matnr, this.systemClassData[0].country);
        this.backupRowTable = this.copyObjToNew(this.rowDialogTable);
        this.rowDialogTable = altaObj;
        this.modelAltaArmados.setProperty("/", altaObj);
        this.getView().getModel("modelAltaArmados").refresh(true);
        this.frgById("frgCmbxArmados").setSelectedKey("Camas por Pallet 1");
        this.frgById("frgCmbxArmados").fireChange();
        this.frgById("frgFormValidateMatnr").setVisible(false);
        this.frgById("frgFormArmadoMatnr").setVisible(true);
        this.frgById("frgFormPPC").setVisible(true);

        this.frgById("frgInputMatnr").setValue(foundObj.matnr + " - " + foundObj.maktx);
        this.frgById("frgInputMatnr").setEnabled(false);
        this.frgById("frgBtnSaveDialogArmado").setVisible(true);




      } else {
        MessageBox.show("Material " + matnrList[0].matnr + " NO encontrado \nFavor de verificar el material", MessageBox.Icon.ERROR, "Alta de Material");
      }

      BusyIndicator.hide();
    },

    onChangeAltaArmados: function () {
      let objArmados = this.rowDialogTable;
      let key = this.frgById("frgCmbxArmados").getSelectedKey();
      switch (key) {
        case objArmados.zcpp.zcpp1Desc:
          for (let i = 1; i < 10; i++) {
            if (i == 1) {
              this.frgById("frgFrmElmCPP" + i).setVisible(true);
              this.frgById("frgFrmElmCPC" + i + "_1").setVisible(true);
              this.frgById("frgFrmElmCPC" + i + "_2").setVisible(true);
              this.frgById("frgFrmElmCPC" + i + "_3").setVisible(true);
              this.frgById("frgFrmElmCPC" + i + "_4").setVisible(true);
              this.frgById("frgFrmElmCPC" + i + "_5").setVisible(true);
              this.frgById("frgFrmElmCPC" + i + "_6").setVisible(true);
              this.frgById("frgFrmElmCPC" + i + "_7").setVisible(true);
              this.frgById("frgFrmElmCPC" + i + "_8").setVisible(true);
              this.frgById("frgFrmElmCPC" + i + "_9").setVisible(true);
            } else {
              this.frgById("frgFrmElmCPP" + i).setVisible(false);
              this.frgById("frgFrmElmCPC" + i + "_1").setVisible(false);
              this.frgById("frgFrmElmCPC" + i + "_2").setVisible(false);
              this.frgById("frgFrmElmCPC" + i + "_3").setVisible(false);
              this.frgById("frgFrmElmCPC" + i + "_4").setVisible(false);
              this.frgById("frgFrmElmCPC" + i + "_5").setVisible(false);
              this.frgById("frgFrmElmCPC" + i + "_6").setVisible(false);
              this.frgById("frgFrmElmCPC" + i + "_7").setVisible(false);
              this.frgById("frgFrmElmCPC" + i + "_8").setVisible(false);
              this.frgById("frgFrmElmCPC" + i + "_9").setVisible(false);
            }

          }

          break;
        case objArmados.zcpp.zcpp2Desc:
          for (let i = 1; i < 10; i++) {
            if (i == 2) {
              this.frgById("frgFrmElmCPP" + i).setVisible(true);
              this.frgById("frgFrmElmCPC" + i + "_1").setVisible(true);
              this.frgById("frgFrmElmCPC" + i + "_2").setVisible(true);
              this.frgById("frgFrmElmCPC" + i + "_3").setVisible(true);
              this.frgById("frgFrmElmCPC" + i + "_4").setVisible(true);
              this.frgById("frgFrmElmCPC" + i + "_5").setVisible(true);
              this.frgById("frgFrmElmCPC" + i + "_6").setVisible(true);
              this.frgById("frgFrmElmCPC" + i + "_7").setVisible(true);
              this.frgById("frgFrmElmCPC" + i + "_8").setVisible(true);
              this.frgById("frgFrmElmCPC" + i + "_9").setVisible(true);
            } else {
              this.frgById("frgFrmElmCPP" + i).setVisible(false);
              this.frgById("frgFrmElmCPC" + i + "_1").setVisible(false);
              this.frgById("frgFrmElmCPC" + i + "_2").setVisible(false);
              this.frgById("frgFrmElmCPC" + i + "_3").setVisible(false);
              this.frgById("frgFrmElmCPC" + i + "_4").setVisible(false);
              this.frgById("frgFrmElmCPC" + i + "_5").setVisible(false);
              this.frgById("frgFrmElmCPC" + i + "_6").setVisible(false);
              this.frgById("frgFrmElmCPC" + i + "_7").setVisible(false);
              this.frgById("frgFrmElmCPC" + i + "_8").setVisible(false);
              this.frgById("frgFrmElmCPC" + i + "_9").setVisible(false);
            }

          }
          break;
        case objArmados.zcpp.zcpp3Desc:
          for (let i = 1; i < 10; i++) {
            if (i == 3) {
              this.frgById("frgFrmElmCPP" + i).setVisible(true);
              this.frgById("frgFrmElmCPC" + i + "_1").setVisible(true);
              this.frgById("frgFrmElmCPC" + i + "_2").setVisible(true);
              this.frgById("frgFrmElmCPC" + i + "_3").setVisible(true);
              this.frgById("frgFrmElmCPC" + i + "_4").setVisible(true);
              this.frgById("frgFrmElmCPC" + i + "_5").setVisible(true);
              this.frgById("frgFrmElmCPC" + i + "_6").setVisible(true);
              this.frgById("frgFrmElmCPC" + i + "_7").setVisible(true);
              this.frgById("frgFrmElmCPC" + i + "_8").setVisible(true);
              this.frgById("frgFrmElmCPC" + i + "_9").setVisible(true);
            } else {
              this.frgById("frgFrmElmCPP" + i).setVisible(false);
              this.frgById("frgFrmElmCPC" + i + "_1").setVisible(false);
              this.frgById("frgFrmElmCPC" + i + "_2").setVisible(false);
              this.frgById("frgFrmElmCPC" + i + "_3").setVisible(false);
              this.frgById("frgFrmElmCPC" + i + "_4").setVisible(false);
              this.frgById("frgFrmElmCPC" + i + "_5").setVisible(false);
              this.frgById("frgFrmElmCPC" + i + "_6").setVisible(false);
              this.frgById("frgFrmElmCPC" + i + "_7").setVisible(false);
              this.frgById("frgFrmElmCPC" + i + "_8").setVisible(false);
              this.frgById("frgFrmElmCPC" + i + "_9").setVisible(false);
            }

          }
          break;
        case objArmados.zcpp.zcpp4Desc:
          for (let i = 1; i < 10; i++) {
            if (i == 4) {
              this.frgById("frgFrmElmCPP" + i).setVisible(true);
              this.frgById("frgFrmElmCPC" + i + "_1").setVisible(true);
              this.frgById("frgFrmElmCPC" + i + "_2").setVisible(true);
              this.frgById("frgFrmElmCPC" + i + "_3").setVisible(true);
              this.frgById("frgFrmElmCPC" + i + "_4").setVisible(true);
              this.frgById("frgFrmElmCPC" + i + "_5").setVisible(true);
              this.frgById("frgFrmElmCPC" + i + "_6").setVisible(true);
              this.frgById("frgFrmElmCPC" + i + "_7").setVisible(true);
              this.frgById("frgFrmElmCPC" + i + "_8").setVisible(true);
              this.frgById("frgFrmElmCPC" + i + "_9").setVisible(true);
            } else {
              this.frgById("frgFrmElmCPP" + i).setVisible(false);
              this.frgById("frgFrmElmCPC" + i + "_1").setVisible(false);
              this.frgById("frgFrmElmCPC" + i + "_2").setVisible(false);
              this.frgById("frgFrmElmCPC" + i + "_3").setVisible(false);
              this.frgById("frgFrmElmCPC" + i + "_4").setVisible(false);
              this.frgById("frgFrmElmCPC" + i + "_5").setVisible(false);
              this.frgById("frgFrmElmCPC" + i + "_6").setVisible(false);
              this.frgById("frgFrmElmCPC" + i + "_7").setVisible(false);
              this.frgById("frgFrmElmCPC" + i + "_8").setVisible(false);
              this.frgById("frgFrmElmCPC" + i + "_9").setVisible(false);
            }

          }
          break;
        case objArmados.zcpp.zcpp5Desc:
          for (let i = 1; i < 10; i++) {
            if (i == 5) {
              this.frgById("frgFrmElmCPP" + i).setVisible(true);
              this.frgById("frgFrmElmCPC" + i + "_1").setVisible(true);
              this.frgById("frgFrmElmCPC" + i + "_2").setVisible(true);
              this.frgById("frgFrmElmCPC" + i + "_3").setVisible(true);
              this.frgById("frgFrmElmCPC" + i + "_4").setVisible(true);
              this.frgById("frgFrmElmCPC" + i + "_5").setVisible(true);
              this.frgById("frgFrmElmCPC" + i + "_6").setVisible(true);
              this.frgById("frgFrmElmCPC" + i + "_7").setVisible(true);
              this.frgById("frgFrmElmCPC" + i + "_8").setVisible(true);
              this.frgById("frgFrmElmCPC" + i + "_9").setVisible(true);
            } else {
              this.frgById("frgFrmElmCPP" + i).setVisible(false);
              this.frgById("frgFrmElmCPC" + i + "_1").setVisible(false);
              this.frgById("frgFrmElmCPC" + i + "_2").setVisible(false);
              this.frgById("frgFrmElmCPC" + i + "_3").setVisible(false);
              this.frgById("frgFrmElmCPC" + i + "_4").setVisible(false);
              this.frgById("frgFrmElmCPC" + i + "_5").setVisible(false);
              this.frgById("frgFrmElmCPC" + i + "_6").setVisible(false);
              this.frgById("frgFrmElmCPC" + i + "_7").setVisible(false);
              this.frgById("frgFrmElmCPC" + i + "_8").setVisible(false);
              this.frgById("frgFrmElmCPC" + i + "_9").setVisible(false);
            }

          }
          break;
        case objArmados.zcpp.zcpp6Desc:
          for (let i = 1; i < 10; i++) {
            if (i == 6) {
              this.frgById("frgFrmElmCPP" + i).setVisible(true);
              this.frgById("frgFrmElmCPC" + i + "_1").setVisible(true);
              this.frgById("frgFrmElmCPC" + i + "_2").setVisible(true);
              this.frgById("frgFrmElmCPC" + i + "_3").setVisible(true);
              this.frgById("frgFrmElmCPC" + i + "_4").setVisible(true);
              this.frgById("frgFrmElmCPC" + i + "_5").setVisible(true);
              this.frgById("frgFrmElmCPC" + i + "_6").setVisible(true);
              this.frgById("frgFrmElmCPC" + i + "_7").setVisible(true);
              this.frgById("frgFrmElmCPC" + i + "_8").setVisible(true);
              this.frgById("frgFrmElmCPC" + i + "_9").setVisible(true);
            } else {
              this.frgById("frgFrmElmCPP" + i).setVisible(false);
              this.frgById("frgFrmElmCPC" + i + "_1").setVisible(false);
              this.frgById("frgFrmElmCPC" + i + "_2").setVisible(false);
              this.frgById("frgFrmElmCPC" + i + "_3").setVisible(false);
              this.frgById("frgFrmElmCPC" + i + "_4").setVisible(false);
              this.frgById("frgFrmElmCPC" + i + "_5").setVisible(false);
              this.frgById("frgFrmElmCPC" + i + "_6").setVisible(false);
              this.frgById("frgFrmElmCPC" + i + "_7").setVisible(false);
              this.frgById("frgFrmElmCPC" + i + "_8").setVisible(false);
              this.frgById("frgFrmElmCPC" + i + "_9").setVisible(false);
            }

          }
          break;
        case objArmados.zcpp.zcpp7Desc:
          for (let i = 1; i < 10; i++) {
            if (i == 7) {
              this.frgById("frgFrmElmCPP" + i).setVisible(true);
              this.frgById("frgFrmElmCPC" + i + "_1").setVisible(true);
              this.frgById("frgFrmElmCPC" + i + "_2").setVisible(true);
              this.frgById("frgFrmElmCPC" + i + "_3").setVisible(true);
              this.frgById("frgFrmElmCPC" + i + "_4").setVisible(true);
              this.frgById("frgFrmElmCPC" + i + "_5").setVisible(true);
              this.frgById("frgFrmElmCPC" + i + "_6").setVisible(true);
              this.frgById("frgFrmElmCPC" + i + "_7").setVisible(true);
              this.frgById("frgFrmElmCPC" + i + "_8").setVisible(true);
              this.frgById("frgFrmElmCPC" + i + "_9").setVisible(true);
            } else {
              this.frgById("frgFrmElmCPP" + i).setVisible(false);
              this.frgById("frgFrmElmCPC" + i + "_1").setVisible(false);
              this.frgById("frgFrmElmCPC" + i + "_2").setVisible(false);
              this.frgById("frgFrmElmCPC" + i + "_3").setVisible(false);
              this.frgById("frgFrmElmCPC" + i + "_4").setVisible(false);
              this.frgById("frgFrmElmCPC" + i + "_5").setVisible(false);
              this.frgById("frgFrmElmCPC" + i + "_6").setVisible(false);
              this.frgById("frgFrmElmCPC" + i + "_7").setVisible(false);
              this.frgById("frgFrmElmCPC" + i + "_8").setVisible(false);
              this.frgById("frgFrmElmCPC" + i + "_9").setVisible(false);
            }

          }
          break;
        case objArmados.zcpp.zcpp8Desc:
          for (let i = 1; i < 10; i++) {
            if (i == 8) {
              this.frgById("frgFrmElmCPP" + i).setVisible(true);
              this.frgById("frgFrmElmCPC" + i + "_1").setVisible(true);
              this.frgById("frgFrmElmCPC" + i + "_2").setVisible(true);
              this.frgById("frgFrmElmCPC" + i + "_3").setVisible(true);
              this.frgById("frgFrmElmCPC" + i + "_4").setVisible(true);
              this.frgById("frgFrmElmCPC" + i + "_5").setVisible(true);
              this.frgById("frgFrmElmCPC" + i + "_6").setVisible(true);
              this.frgById("frgFrmElmCPC" + i + "_7").setVisible(true);
              this.frgById("frgFrmElmCPC" + i + "_8").setVisible(true);
              this.frgById("frgFrmElmCPC" + i + "_9").setVisible(true);
            } else {
              this.frgById("frgFrmElmCPP" + i).setVisible(false);
              this.frgById("frgFrmElmCPC" + i + "_1").setVisible(false);
              this.frgById("frgFrmElmCPC" + i + "_2").setVisible(false);
              this.frgById("frgFrmElmCPC" + i + "_3").setVisible(false);
              this.frgById("frgFrmElmCPC" + i + "_4").setVisible(false);
              this.frgById("frgFrmElmCPC" + i + "_5").setVisible(false);
              this.frgById("frgFrmElmCPC" + i + "_6").setVisible(false);
              this.frgById("frgFrmElmCPC" + i + "_7").setVisible(false);
              this.frgById("frgFrmElmCPC" + i + "_8").setVisible(false);
              this.frgById("frgFrmElmCPC" + i + "_9").setVisible(false);
            }

          }
          break;
        case objArmados.zcpp.zcpp9Desc:
          for (let i = 1; i < 10; i++) {
            if (i == 9) {
              this.frgById("frgFrmElmCPP" + i).setVisible(true);
              this.frgById("frgFrmElmCPC" + i + "_1").setVisible(true);
              this.frgById("frgFrmElmCPC" + i + "_2").setVisible(true);
              this.frgById("frgFrmElmCPC" + i + "_3").setVisible(true);
              this.frgById("frgFrmElmCPC" + i + "_4").setVisible(true);
              this.frgById("frgFrmElmCPC" + i + "_5").setVisible(true);
              this.frgById("frgFrmElmCPC" + i + "_6").setVisible(true);
              this.frgById("frgFrmElmCPC" + i + "_7").setVisible(true);
              this.frgById("frgFrmElmCPC" + i + "_8").setVisible(true);
              this.frgById("frgFrmElmCPC" + i + "_9").setVisible(true);
            } else {
              this.frgById("frgFrmElmCPP" + i).setVisible(false);
              this.frgById("frgFrmElmCPC" + i + "_1").setVisible(false);
              this.frgById("frgFrmElmCPC" + i + "_2").setVisible(false);
              this.frgById("frgFrmElmCPC" + i + "_3").setVisible(false);
              this.frgById("frgFrmElmCPC" + i + "_4").setVisible(false);
              this.frgById("frgFrmElmCPC" + i + "_5").setVisible(false);
              this.frgById("frgFrmElmCPC" + i + "_6").setVisible(false);
              this.frgById("frgFrmElmCPC" + i + "_7").setVisible(false);
              this.frgById("frgFrmElmCPC" + i + "_8").setVisible(false);
              this.frgById("frgFrmElmCPC" + i + "_9").setVisible(false);
            }

          }
          break;
        default: console.log("Armado no válido");
      }
    },

    execValidateMatnr: async function (matnrList) {
      const request = { tokenObject: null, lsObject: matnrList };
      const json = await this.execService(InveServices.VALIDATE_MATNR, request, "setSystemClassInvCic", this.showLog);

      if (json) {
        return json.lsObject;
      }
    },

    //Editar las camas por caja de un material existente
    changeEnabledZCPC: function () {
      let enabled = this.byId("stInCPP").getEditable();
      this.byId("stInCPP").setEditable(!enabled);
      for (let i = 1; i < 10; i++) {
        this.byId("stInCPC" + i).setEditable(!enabled);
      }
    },

    hideMainMenu: function () {

      this.byId("btnAddMatnr").setVisible(false);
      this.byId("btnAddZCPP").setVisible(false);
      this.byId("btnAEditZCPP").setVisible(false);
      this.byId("btnAddZPPC").setVisible(false);
      this.byId("sgmntBtnsZPPC").setEnabled(false);

    },

    showMainMenu: function () {
      this.byId("btnAddMatnr").setVisible(true);
      this.byId("btnAddZCPP").setVisible(true);
      this.byId("btnAEditZCPP").setVisible(true);
      this.byId("btnAddZPPC").setVisible(true);
      this.byId("sgmntBtnsZPPC").setEnabled(true);
    },

    onEditZCPP: function () {
      this.setOnEdit(true);
      this.EditedZCPP = true;
      let count = 0;
      for (let i = 1; i < 10; i++) {
        if (this.byId("frmElmCPC" + i).getVisible()) {
          count++;
        }
      }
      if (count == 1) {
        this.byId("btnRemoveZCPC").setEnabled(false);
      } else if (count == 9) {
        this.byId("btnAddZCPC").setEnabled(false);
      }
      this.editedArmado = this.copyObjToNew(this.rowDialogTable);
      this.hideMainMenu();
      this.byId("btnAddZCPC").setVisible(true);
      this.byId("btnRemoveZCPC").setVisible(true);
      this.byId("btnCancelZCPP").setVisible(true);
      this.byId("btnSaveZCPC").setVisible(true);
      this.byId("inputSelectMatnr").setEnabled(false);
      this.changeEnabledZCPC();


    },

    onCancelZCPP: function () {
      MessageBox.confirm(
        "¿Desea cancelar la edición del armado?", {
        icon: MessageBox.Icon.WARNING,
        actions: [MessageBox.Action.YES, MessageBox.Action.NO],
        onClose: function (oAction) {

          if (oAction == 'YES') {
            this.setOnEdit(false);
            this.EditedZCPP = false;
            this.onChangeMatnr();
            this.byId("btnAddZCPC").setVisible(false);
            this.byId("btnRemoveZCPC").setVisible(false);
            this.byId("btnAddZCPC").setEnabled(true);
            this.byId("btnRemoveZCPC").setEnabled(true);
            this.byId("btnCancelZCPP").setVisible(false);
            this.byId("btnSaveZCPC").setVisible(false);
            this.byId("inputSelectMatnr").setEnabled(true);
            this.changeEnabledZCPC();
            this.showMainMenu();
          }
        }.bind(this)
      }
      );


    },

    onAddZCPC: function () {
      for (let i = 1; i < 10; i++) {
        if (!this.byId("frmElmCPC" + i).getVisible()) {
          if (i == 9) {
            this.byId("btnAddZCPC").setEnabled(false);
            this.byId("btnRemoveZCPC").setEnabled(true);
          } else if (i > 1 && i < 9) {
            this.byId("btnAddZCPC").setEnabled(true);
            this.byId("btnRemoveZCPC").setEnabled(true);
          }
          this.byId("stInCPC" + i).setValue(0.000);
          this.byId("frmElmCPC" + i).setVisible(true);
          break;
        }
      }
    },

    onRemoveZCPC: function () {
      let count = 0;
      for (let i = 1; i < 10; i++) {
        if (!this.byId("frmElmCPC" + i).getVisible()) {
          if ((i - 1) == 2) {
            this.byId("btnAddZCPC").setEnabled(true);
            this.byId("btnRemoveZCPC").setEnabled(false);
          } else if ((i - 1) > 1 && ((i - 1) < 9)) {
            this.byId("btnAddZCPC").setEnabled(true);
            this.byId("btnRemoveZCPC").setEnabled(true);
          }

          this.byId("frmElmCPC" + (i - 1)).setVisible(false);
          this.byId("stInCPC" + (i - 1)).setValue(0.000);
          this.byId("stInCPC" + (i - 1)).fireChange();

          break;
        }
        count++;
        if (count == 9) {
          this.byId("frmElmCPC9").setVisible(false);
          this.byId("stInCPC9").setValue(0.000);
          this.byId("stInCPC9").fireChange();

        }
      }
    },

    onChangeStInCPP: function () {
      let objArmados = this.rowDialogTable;
      switch (this.byId("lblCPP").getText()) {
        case objArmados.zcpp.zcpp1Desc:
          this.editedArmado.zcpp.zcpp1Value = this.setFormat(3, this.byId("stInCPP").getValue());
          break;
        case objArmados.zcpp.zcpp2Desc:
          this.editedArmado.zcpp.zcpp2Value = this.setFormat(3, this.byId("stInCPP").getValue());
          break;
        case objArmados.zcpp.zcpp3Desc:
          this.editedArmado.zcpp.zcpp3Value = this.setFormat(3, this.byId("stInCPP").getValue());
          break;
        case objArmados.zcpp.zcpp4Desc:
          this.editedArmado.zcpp.zcpp4Value = this.setFormat(3, this.byId("stInCPP").getValue());
          break;
        case objArmados.zcpp.zcpp5Desc:
          this.editedArmado.zcpp.zcpp5Value = this.setFormat(3, this.byId("stInCPP").getValue());
          break;
        case objArmados.zcpp.zcpp6Desc:
          this.editedArmado.zcpp.zcpp6Value = this.setFormat(3, this.byId("stInCPP").getValue());
          break;
        case objArmados.zcpp.zcpp7Desc:
          this.editedArmado.zcpp.zcpp7Value = this.setFormat(3, this.byId("stInCPP").getValue());
          break;
        case objArmados.zcpp.zcpp8Desc:
          this.editedArmado.zcpp.zcpp8Value = this.setFormat(3, this.byId("stInCPP").getValue());
          break;
        case objArmados.zcpp.zcpp9Desc:
          this.editedArmado.zcpp.zcpp9Value = this.setFormat(3, this.byId("stInCPP").getValue());
          break;
        default: console.log("Armado no válido");
      }

    },

    onChangeStInCPC1: function (oEvent) {
      let objArmados = this.rowDialogTable;
      switch (this.byId("lblCPP").getText()) {
        case objArmados.zcpp.zcpp1Desc:
          this.editedArmado.zcpc.zcpc1_1Value = this.setFormat(3, oEvent.getSource().getValue());
          break;
        case objArmados.zcpp.zcpp2Desc:
          this.editedArmado.zcpc.zcpc2_1Value = this.setFormat(3, oEvent.getSource().getValue());
          break;
        case objArmados.zcpp.zcpp3Desc:
          this.editedArmado.zcpc.zcpc3_1Value = this.setFormat(3, oEvent.getSource().getValue());
          break;
        case objArmados.zcpp.zcpp4Desc:
          this.editedArmado.zcpc.zcpc4_1Value = this.setFormat(3, oEvent.getSource().getValue());
          break;
        case objArmados.zcpp.zcpp5Desc:
          this.editedArmado.zcpc.zcpc5_1Value = this.setFormat(3, oEvent.getSource().getValue());
          break;
        case objArmados.zcpp.zcpp6Desc:
          this.editedArmado.zcpc.zcpc6_1Value = this.setFormat(3, oEvent.getSource().getValue());
          break;
        case objArmados.zcpp.zcpp7Desc:
          this.editedArmado.zcpc.zcpc7_1Value = this.setFormat(3, oEvent.getSource().getValue());
          break;
        case objArmados.zcpp.zcpp8Desc:
          this.editedArmado.zcpc.zcpc8_1Value = this.setFormat(3, oEvent.getSource().getValue());
          break;
        case objArmados.zcpp.zcpp9Desc:
          this.editedArmado.zcpc.zcpc9_1Value = this.setFormat(3, oEvent.getSource().getValue());
          break;
        default: console.log("Armado no válido");
      }
    },

    onChangeStInCPC2: function (oEvent) {
      let objArmados = this.rowDialogTable;
      switch (this.byId("lblCPP").getText()) {
        case objArmados.zcpp.zcpp1Desc:
          this.editedArmado.zcpc.zcpc1_2Value = this.setFormat(3, oEvent.getSource().getValue());
          break;
        case objArmados.zcpp.zcpp2Desc:
          this.editedArmado.zcpc.zcpc2_2Value = this.setFormat(3, oEvent.getSource().getValue());
          break;
        case objArmados.zcpp.zcpp3Desc:
          this.editedArmado.zcpc.zcpc3_2Value = this.setFormat(3, oEvent.getSource().getValue());
          break;
        case objArmados.zcpp.zcpp4Desc:
          this.editedArmado.zcpc.zcpc4_2Value = this.setFormat(3, oEvent.getSource().getValue());
          break;
        case objArmados.zcpp.zcpp5Desc:
          this.editedArmado.zcpc.zcpc5_2Value = this.setFormat(3, oEvent.getSource().getValue());
          break;
        case objArmados.zcpp.zcpp6Desc:
          this.editedArmado.zcpc.zcpc6_2Value = this.setFormat(3, oEvent.getSource().getValue());
          break;
        case objArmados.zcpp.zcpp7Desc:
          this.editedArmado.zcpc.zcpc7_2Value = this.setFormat(3, oEvent.getSource().getValue());
          break;
        case objArmados.zcpp.zcpp8Desc:
          this.editedArmado.zcpc.zcpc8_2Value = this.setFormat(3, oEvent.getSource().getValue());
          break;
        case objArmados.zcpp.zcpp9Desc:
          this.editedArmado.zcpc.zcpc9_2Value = this.setFormat(3, oEvent.getSource().getValue());
          break;
        default: console.log("Armado no válido");
      }
    },

    onChangeStInCPC3: function (oEvent) {
      let objArmados = this.rowDialogTable;
      switch (this.byId("lblCPP").getText()) {
        case objArmados.zcpp.zcpp1Desc:
          this.editedArmado.zcpc.zcpc1_3Value = this.setFormat(3, oEvent.getSource().getValue());
          break;
        case objArmados.zcpp.zcpp2Desc:
          this.editedArmado.zcpc.zcpc2_3Value = this.setFormat(3, oEvent.getSource().getValue());
          break;
        case objArmados.zcpp.zcpp3Desc:
          this.editedArmado.zcpc.zcpc3_3Value = this.setFormat(3, oEvent.getSource().getValue());
          break;
        case objArmados.zcpp.zcpp4Desc:
          this.editedArmado.zcpc.zcpc4_3Value = this.setFormat(3, oEvent.getSource().getValue());
          break;
        case objArmados.zcpp.zcpp5Desc:
          this.editedArmado.zcpc.zcpc5_3Value = this.setFormat(3, oEvent.getSource().getValue());
          break;
        case objArmados.zcpp.zcpp6Desc:
          this.editedArmado.zcpc.zcpc6_3Value = this.setFormat(3, oEvent.getSource().getValue());
          break;
        case objArmados.zcpp.zcpp7Desc:
          this.editedArmado.zcpc.zcpc7_3Value = this.setFormat(3, oEvent.getSource().getValue());
          break;
        case objArmados.zcpp.zcpp8Desc:
          this.editedArmado.zcpc.zcpc8_3Value = this.setFormat(3, oEvent.getSource().getValue());
          break;
        case objArmados.zcpp.zcpp9Desc:
          this.editedArmado.zcpc.zcpc9_3Value = this.setFormat(3, oEvent.getSource().getValue());
          break;
        default: console.log("Armado no válido");
      }
    },

    onChangeStInCPC4: function (oEvent) {
      let objArmados = this.rowDialogTable;
      switch (this.byId("lblCPP").getText()) {
        case objArmados.zcpp.zcpp1Desc:
          this.editedArmado.zcpc.zcpc1_4Value = this.setFormat(3, oEvent.getSource().getValue());
          break;
        case objArmados.zcpp.zcpp2Desc:
          this.editedArmado.zcpc.zcpc2_4Value = this.setFormat(3, oEvent.getSource().getValue());
          break;
        case objArmados.zcpp.zcpp3Desc:
          this.editedArmado.zcpc.zcpc3_4Value = this.setFormat(3, oEvent.getSource().getValue());
          break;
        case objArmados.zcpp.zcpp4Desc:
          this.editedArmado.zcpc.zcpc4_4Value = this.setFormat(3, oEvent.getSource().getValue());
          break;
        case objArmados.zcpp.zcpp5Desc:
          this.editedArmado.zcpc.zcpc5_4Value = this.setFormat(3, oEvent.getSource().getValue());
          break;
        case objArmados.zcpp.zcpp6Desc:
          this.editedArmado.zcpc.zcpc6_4Value = this.setFormat(3, oEvent.getSource().getValue());
          break;
        case objArmados.zcpp.zcpp7Desc:
          this.editedArmado.zcpc.zcpc7_4Value = this.setFormat(3, oEvent.getSource().getValue());
          break;
        case objArmados.zcpp.zcpp8Desc:
          this.editedArmado.zcpc.zcpc8_4Value = this.setFormat(3, oEvent.getSource().getValue());
          break;
        case objArmados.zcpp.zcpp9Desc:
          this.editedArmado.zcpc.zcpc9_4Value = this.setFormat(3, oEvent.getSource().getValue());
          break;
        default: console.log("Armado no válido");
      }
    },

    onChangeStInCPC5: function (oEvent) {
      let objArmados = this.rowDialogTable;
      switch (this.byId("lblCPP").getText()) {
        case objArmados.zcpp.zcpp1Desc:
          this.editedArmado.zcpc.zcpc1_5Value = this.setFormat(3, oEvent.getSource().getValue());
          break;
        case objArmados.zcpp.zcpp2Desc:
          this.editedArmado.zcpc.zcpc2_5Value = this.setFormat(3, oEvent.getSource().getValue());
          break;
        case objArmados.zcpp.zcpp3Desc:
          this.editedArmado.zcpc.zcpc3_5Value = this.setFormat(3, oEvent.getSource().getValue());
          break;
        case objArmados.zcpp.zcpp4Desc:
          this.editedArmado.zcpc.zcpc4_5Value = this.setFormat(3, oEvent.getSource().getValue());
          break;
        case objArmados.zcpp.zcpp5Desc:
          this.editedArmado.zcpc.zcpc5_5Value = this.setFormat(3, oEvent.getSource().getValue());
          break;
        case objArmados.zcpp.zcpp6Desc:
          this.editedArmado.zcpc.zcpc6_5Value = this.setFormat(3, oEvent.getSource().getValue());
          break;
        case objArmados.zcpp.zcpp7Desc:
          this.editedArmado.zcpc.zcpc7_5Value = this.setFormat(3, oEvent.getSource().getValue());
          break;
        case objArmados.zcpp.zcpp8Desc:
          this.editedArmado.zcpc.zcpc8_5Value = this.setFormat(3, oEvent.getSource().getValue());
          break;
        case objArmados.zcpp.zcpp9Desc:
          this.editedArmado.zcpc.zcpc9_5Value = this.setFormat(3, oEvent.getSource().getValue());
          break;
        default: console.log("Armado no válido");
      }
    },

    onChangeStInCPC6: function (oEvent) {
      let objArmados = this.rowDialogTable;
      switch (this.byId("lblCPP").getText()) {
        case objArmados.zcpp.zcpp1Desc:
          this.editedArmado.zcpc.zcpc1_6Value = this.setFormat(3, oEvent.getSource().getValue());
          break;
        case objArmados.zcpp.zcpp2Desc:
          this.editedArmado.zcpc.zcpc2_6Value = this.setFormat(3, oEvent.getSource().getValue());
          break;
        case objArmados.zcpp.zcpp3Desc:
          this.editedArmado.zcpc.zcpc3_6Value = this.setFormat(3, oEvent.getSource().getValue());
          break;
        case objArmados.zcpp.zcpp4Desc:
          this.editedArmado.zcpc.zcpc4_6Value = this.setFormat(3, oEvent.getSource().getValue());
          break;
        case objArmados.zcpp.zcpp5Desc:
          this.editedArmado.zcpc.zcpc5_6Value = this.setFormat(3, oEvent.getSource().getValue());
          break;
        case objArmados.zcpp.zcpp6Desc:
          this.editedArmado.zcpc.zcpc6_6Value = this.setFormat(3, oEvent.getSource().getValue());
          break;
        case objArmados.zcpp.zcpp7Desc:
          this.editedArmado.zcpc.zcpc7_6Value = this.setFormat(3, oEvent.getSource().getValue());
          break;
        case objArmados.zcpp.zcpp8Desc:
          this.editedArmado.zcpc.zcpc8_6Value = this.setFormat(3, oEvent.getSource().getValue());
          break;
        case objArmados.zcpp.zcpp9Desc:
          this.editedArmado.zcpc.zcpc9_6Value = this.setFormat(3, oEvent.getSource().getValue());
          break;
        default: console.log("Armado no válido");
      }
    },

    onChangeStInCPC7: function (oEvent) {
      let objArmados = this.rowDialogTable;
      switch (this.byId("lblCPP").getText()) {
        case objArmados.zcpp.zcpp1Desc:
          this.editedArmado.zcpc.zcpc1_7Value = this.setFormat(3, oEvent.getSource().getValue());
          break;
        case objArmados.zcpp.zcpp2Desc:
          this.editedArmado.zcpc.zcpc2_7Value = this.setFormat(3, oEvent.getSource().getValue());
          break;
        case objArmados.zcpp.zcpp3Desc:
          this.editedArmado.zcpc.zcpc3_7Value = this.setFormat(3, oEvent.getSource().getValue());
          break;
        case objArmados.zcpp.zcpp4Desc:
          this.editedArmado.zcpc.zcpc4_7Value = this.setFormat(3, oEvent.getSource().getValue());
          break;
        case objArmados.zcpp.zcpp5Desc:
          this.editedArmado.zcpc.zcpc5_7Value = this.setFormat(3, oEvent.getSource().getValue());
          break;
        case objArmados.zcpp.zcpp6Desc:
          this.editedArmado.zcpc.zcpc6_7Value = this.setFormat(3, oEvent.getSource().getValue());
          break;
        case objArmados.zcpp.zcpp7Desc:
          this.editedArmado.zcpc.zcpc7_7Value = this.setFormat(3, oEvent.getSource().getValue());
          break;
        case objArmados.zcpp.zcpp8Desc:
          this.editedArmado.zcpc.zcpc8_7Value = this.setFormat(3, oEvent.getSource().getValue());
          break;
        case objArmados.zcpp.zcpp9Desc:
          this.editedArmado.zcpc.zcpc9_7Value = this.setFormat(3, oEvent.getSource().getValue());
          break;
        default: console.log("Armado no válido");
      }
    },

    onChangeStInCPC8: function (oEvent) {
      let objArmados = this.rowDialogTable;
      switch (this.byId("lblCPP").getText()) {
        case objArmados.zcpp.zcpp1Desc:
          this.editedArmado.zcpc.zcpc1_8Value = this.setFormat(3, oEvent.getSource().getValue());
          break;
        case objArmados.zcpp.zcpp2Desc:
          this.editedArmado.zcpc.zcpc2_8Value = this.setFormat(3, oEvent.getSource().getValue());
          break;
        case objArmados.zcpp.zcpp3Desc:
          this.editedArmado.zcpc.zcpc3_8Value = this.setFormat(3, oEvent.getSource().getValue());
          break;
        case objArmados.zcpp.zcpp4Desc:
          this.editedArmado.zcpc.zcpc4_8Value = this.setFormat(3, oEvent.getSource().getValue());
          break;
        case objArmados.zcpp.zcpp5Desc:
          this.editedArmado.zcpc.zcpc5_8Value = this.setFormat(3, oEvent.getSource().getValue());
          break;
        case objArmados.zcpp.zcpp6Desc:
          this.editedArmado.zcpc.zcpc6_8Value = this.setFormat(3, oEvent.getSource().getValue());
          break;
        case objArmados.zcpp.zcpp7Desc:
          this.editedArmado.zcpc.zcpc7_8Value = this.setFormat(3, oEvent.getSource().getValue());
          break;
        case objArmados.zcpp.zcpp8Desc:
          this.editedArmado.zcpc.zcpc8_8Value = this.setFormat(3, oEvent.getSource().getValue());
          break;
        case objArmados.zcpp.zcpp9Desc:
          this.editedArmado.zcpc.zcpc9_8Value = this.setFormat(3, oEvent.getSource().getValue());
          break;
        default: console.log("Armado no válido");
      }
    },

    onChangeStInCPC9: function (oEvent) {
      let objArmados = this.rowDialogTable;
      switch (this.byId("lblCPP").getText()) {
        case objArmados.zcpp.zcpp1Desc:
          this.editedArmado.zcpc.zcpc1_9Value = this.setFormat(3, oEvent.getSource().getValue());
          break;
        case objArmados.zcpp.zcpp2Desc:
          this.editedArmado.zcpc.zcpc2_9Value = this.setFormat(3, oEvent.getSource().getValue());
          break;
        case objArmados.zcpp.zcpp3Desc:
          this.editedArmado.zcpc.zcpc3_9Value = this.setFormat(3, oEvent.getSource().getValue());
          break;
        case objArmados.zcpp.zcpp4Desc:
          this.editedArmado.zcpc.zcpc4_9Value = this.setFormat(3, oEvent.getSource().getValue());
          break;
        case objArmados.zcpp.zcpp5Desc:
          this.editedArmado.zcpc.zcpc5_9Value = this.setFormat(3, oEvent.getSource().getValue());
          break;
        case objArmados.zcpp.zcpp6Desc:
          this.editedArmado.zcpc.zcpc6_9Value = this.setFormat(3, oEvent.getSource().getValue());
          break;
        case objArmados.zcpp.zcpp7Desc:
          this.editedArmado.zcpc.zcpc7_9Value = this.setFormat(3, oEvent.getSource().getValue());
          break;
        case objArmados.zcpp.zcpp8Desc:
          this.editedArmado.zcpc.zcpc8_9Value = this.setFormat(3, oEvent.getSource().getValue());
          break;
        case objArmados.zcpp.zcpp9Desc:
          this.editedArmado.zcpc.zcpc9_9Value = this.setFormat(3, oEvent.getSource().getValue());
          break;
        default: console.log("Armado no válido");
      }
    },

    onSaveZCPC: function () {
      this.Edited = true;
      BusyIndicator.show(0);
      this.byId("btnAddZCPC").setVisible(false);
      this.byId("btnRemoveZCPC").setVisible(false);
      this.byId("btnCancelZCPP").setVisible(false);
      this.byId("btnSaveZCPC").setVisible(false);
      this.changeEnabledZCPC();
      this.showMainMenu();
      this.execSetArmadosInve([this.editedArmado], "Edición de pallet");
    },

    copyObjToNew: function (obj) {
      return JSON.parse(JSON.stringify(obj));
    },

    onAddZPPC: function () {
      this.Edited = true;
      this.EditedZPPC = true;//mismo que el onEditZPPC ya que usan el mismo cancel
      this.objArmadosZPPC = this.copyObjToNew(this.rowDialogTable);
      this.byId("btnAddZPPC").setVisible(false);
      this.byId("btnContinueAddZPPC").setVisible(true);
      this.byId("btnEditZPPC").setVisible(false);
      this.byId("btnSaveZPPC").setVisible(true);
      this.byId("btnCancelZPPC").setVisible(true);
      this.byId("sgmntBtnsArmados").setEnabled(false);
      this.byId("cmbxArmados").setEnabled(false);
      this.byId("inputSelectMatnr").setEnabled(false);
      for (let i = 1; i < 10; i++) {
        if (this.byId("frmElmPPC" + i).getVisible()) {
          this.byId("stInPPC" + i).setEditable(true);
        }
        if (!this.byId("frmElmPPC" + i).getVisible()) {
          this.byId("stInPPC" + i).setValue(0.000);
          this.byId("frmElmPPC" + i).setVisible(true);
          this.byId("stInPPC" + i).setEditable(true);
          if (i == 9) {
            this.byId("btnAddZPPC").setEnabled(false);
          }
          break;
        }

      }
    },

    onContinueAddZPPC: function () {
      for (let i = 1; i < 10; i++) {
        if (!this.byId("frmElmPPC" + i).getVisible()) {
          this.byId("stInPPC" + i).setValue(0.000);
          this.byId("frmElmPPC" + i).setVisible(true);
          this.byId("stInPPC" + i).setEditable(true);
          if (i == 9) {
            this.byId("btnContinueAddZPPC").setEnabled(false);
          }
          break;
        }

      }
    },

    onEditZPPC: function () {
      this.setOnEdit(true);
      this.Edited = true;
      this.EditedZPPC = true;
      this.objArmadosZPPC = this.copyObjToNew(this.rowDialogTable);
      this.changeEnabledZPPC();
      this.byId("btnAddZPPC").setVisible(false);
      this.byId("btnEditZPPC").setVisible(false);
      this.byId("btnSaveZPPC").setVisible(true);
      this.byId("btnCancelZPPC").setVisible(true);
      this.byId("sgmntBtnsArmados").setEnabled(false);
      this.byId("cmbxArmados").setEnabled(false);
      this.byId("inputSelectMatnr").setEnabled(false);
    },

    changeEnabledZPPC: function () {
      let enabled = this.byId("stInPPC1").getEditable();
      for (let i = 1; i < 10; i++) {
        this.byId("stInPPC" + i).setEditable(!enabled);
      }
    },

    onCancelZPPC: function () {
      MessageBox.confirm(
        "¿Desea cancelar la edición de piezas por caja?", {
        icon: MessageBox.Icon.WARNING,
        actions: [MessageBox.Action.YES, MessageBox.Action.NO],
        onClose: function (oAction) {

          if (oAction == 'YES') {
            this.setOnEdit(false);
            this.Edited = false;
            this.EditedZPPC = false;
            this.onChangeMatnr();
            this.changeEnabledZPPC();
            this.byId("btnAddZPPC").setVisible(true);
            this.byId("btnContinueAddZPPC").setVisible(false);
            this.byId("btnEditZPPC").setVisible(true);
            this.byId("btnSaveZPPC").setVisible(false);
            this.byId("btnCancelZPPC").setVisible(false);
            this.byId("sgmntBtnsArmados").setEnabled(true);
            this.byId("cmbxArmados").setEnabled(true);
            this.byId("inputSelectMatnr").setEnabled(true);
          }
        }.bind(this)
      }
      );
    },

    onSaveZPPC: function () {
      BusyIndicator.show(0);

      this.byId("btnSaveZPPC").setVisible(false);
      this.byId("btnCancelZPPC").setVisible(false);

      this.changeEnabledZPPC();
      this.byId("btnAddZPPC").setVisible(true);
      this.byId("btnContinueAddZPPC").setVisible(false);
      this.byId("btnEditZPPC").setVisible(true);
      this.byId("btnSaveZPPC").setVisible(false);
      this.byId("btnCancelZPPC").setVisible(false);
      this.byId("sgmntBtnsArmados").setEnabled(true);
      this.byId("cmbxArmados").setEnabled(true);
      this.byId("inputSelectMatnr").setEnabled(true);

      this.execSetArmadosInve([this.objArmadosZPPC], "Edición de Piezas por Caja");
    },

    onChangePPC1: function (oEvent) {
      this.objArmadosZPPC.zppc.zppc1Value = this.setFormat(3, oEvent.getSource().getValue());
    },

    onChangePPC2: function (oEvent) {
      this.objArmadosZPPC.zppc.zppc2Value = this.setFormat(3, oEvent.getSource().getValue());
    },

    onChangePPC3: function (oEvent) {
      this.objArmadosZPPC.zppc.zppc3Value = this.setFormat(3, oEvent.getSource().getValue());
    },

    onChangePPC4: function (oEvent) {
      this.objArmadosZPPC.zppc.zppc4Value = this.setFormat(3, oEvent.getSource().getValue());
    },

    onChangePPC5: function (oEvent) {
      this.objArmadosZPPC.zppc.zppc5Value = this.setFormat(3, oEvent.getSource().getValue());
    },

    onChangePPC6: function (oEvent) {
      this.objArmadosZPPC.zppc.zppc6Value = this.setFormat(3, oEvent.getSource().getValue());
    },

    onChangePPC7: function (oEvent) {
      this.objArmadosZPPC.zppc.zppc7Value = this.setFormat(3, oEvent.getSource().getValue());
    },

    onChangePPC8: function (oEvent) {
      this.objArmadosZPPC.zppc.zppc8Value = this.setFormat(3, oEvent.getSource().getValue());
    },

    onChangePPC9: function (oEvent) {
      this.objArmadosZPPC.zppc.zppc9Value = this.setFormat(3, oEvent.getSource().getValue());
    },

    downloadTemplateSimple: function () {

      let link = document.createElement("a");
      link.href = InveTemplates.ARMADOS;
      link.click();
    },

    downloadTemplateComplete: function () {

      let link = document.createElement("a");
      link.href = InveTemplates.ARMADOS_COMPLETO;
      link.click();
    },

    openFilePicker: function () {
      $('#fileArmados').click();
    },

    uploadTemplate: function () {
      BusyIndicator.show(0);
      let that = this;
      let country = null;
      if (this.containerController.roleExists("INVE_MX")) {
        country = "MX";
      } else if (this.containerController.roleExists("INVE_CO")) {
        country = "CO";
      }
      let file = $('#fileArmados').prop('files')[0];
      let allowedFiles = ['csv'];
      let ext = file.name.split('.').pop().toLowerCase();

      // Check if is an allowed file
      if (allowedFiles.indexOf(ext) == -1) {
        MessageToast.show("Tipo de archivo no permitido, " +
          "solo se permiten archivos de tipo: " + allowedFiles, '20em');
        $('#fileArmados').val("");
        BusyIndicator.hide();
        return;
      }

      let reader = new FileReader();

      // Read file into memory
      reader.readAsText(file, 'ISO-8859-1');

      // Handle errors load
      reader.onload = loadHandler;
      reader.onerror = errorHandler;

      function loadHandler(event) {

        let csv = event.target.result;
        processData(csv);

      }

      async function processData(csv) {

        let allTextLines = csv.split(/\r\n|\n/);
        let data;
        let object;
        let listArmados = [];
        let size = allTextLines.length;
        let currentMatnr = "";

        if (allTextLines[size - 1].indexOf(",") == -1) {
          allTextLines.splice(-1);
        }

        for (let i = 1; i < allTextLines.length; i++) {

          data = allTextLines[i].split(',');

          if (data.length < 3) {
            MessageBox.show("Datos faltantes para la entrada: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
            BusyIndicator.hide();
            return;
          }
          if (currentMatnr != data[0]) {
            object = new Armados(data[0], country);
            listArmados.push(object);
            currentMatnr = data[0];
          }

          switch (data[3]) {
            case "ZCPP1":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpp.zcpp1Value = that.setFormat(3, data[2]);
              break;
            case "ZCPP2":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpp.zcpp2Value = that.setFormat(3, data[2]);
              break;
            case "ZCPP3":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpp.zcpp3Value = that.setFormat(3, data[2]);
              break;
            case "ZCPP4":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpp.zcpp4Value = that.setFormat(3, data[2]);
              break;
            case "ZCPP5":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpp.zcpp5Value = that.setFormat(3, data[2]);
              break;
            case "ZCPP6":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpp.zcpp6Value = that.setFormat(3, data[2]);
              break;
            case "ZCPP7":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpp.zcpp7Value = that.setFormat(3, data[2]);
              break;
            case "ZCPP8":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpp.zcpp8Value = that.setFormat(3, data[2]);
              break;
            case "ZCPP9":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpp.zcpp9Value = that.setFormat(3, data[2]);
              break;

            case "ZCPC1_1":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpc.zcpc1_1Value = that.setFormat(3, data[2]);
              break;
            case "ZCPC1_2":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpc.zcpc1_2Value = that.setFormat(3, data[2]);
              break;
            case "ZCPC1_3":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpc.zcpc1_3Value = that.setFormat(3, data[2]);
              break;
            case "ZCPC1_4":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpc.zcpc1_4Value = that.setFormat(3, data[2]);
              break;
            case "ZCPC1_5":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpc.zcpc1_5Value = that.setFormat(3, data[2]);
              break;
            case "ZCPC1_6":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpc.zcpc1_6Value = that.setFormat(3, data[2]);
              break;
            case "ZCPC1_7":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpc.zcpc1_7Value = that.setFormat(3, data[2]);
              break;
            case "ZCPC1_8":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpc.zcpc1_8Value = that.setFormat(3, data[2]);
              break;
            case "ZCPC1_9":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpc.zcpc1_9Value = that.setFormat(3, data[2]);
              break;

            case "ZCPC2_1":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpc.zcpc2_1Value = that.setFormat(3, data[2]);
              break;
            case "ZCPC2_2":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpc.zcpc2_2Value = that.setFormat(3, data[2]);
              break;
            case "ZCPC2_3":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpc.zcpc2_3Value = that.setFormat(3, data[2]);
              break;
            case "ZCPC2_4":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpc.zcpc2_4Value = that.setFormat(3, data[2]);
              break;
            case "ZCPC2_5":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpc.zcpc2_5Value = that.setFormat(3, data[2]);
              break;
            case "ZCPC2_6":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpc.zcpc2_6Value = that.setFormat(3, data[2]);
              break;
            case "ZCPC2_7":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpc.zcpc2_7Value = that.setFormat(3, data[2]);
              break;
            case "ZCPC2_8":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpc.zcpc2_8Value = that.setFormat(3, data[2]);
              break;
            case "ZCPC2_9":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpc.zcpc2_9Value = that.setFormat(3, data[2]);
              break;

            case "ZCPC3_1":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpc.zcpc3_1Value = that.setFormat(3, data[2]);
              break;
            case "ZCPC3_2":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpc.zcpc3_2Value = that.setFormat(3, data[2]);
              break;
            case "ZCPC3_3":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpc.zcpc3_3Value = that.setFormat(3, data[2]);
              break;
            case "ZCPC3_4":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpc.zcpc3_4Value = that.setFormat(3, data[2]);
              break;
            case "ZCPC3_5":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpc.zcpc3_5Value = that.setFormat(3, data[2]);
              break;
            case "ZCPC3_6":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpc.zcpc3_6Value = that.setFormat(3, data[2]);
              break;
            case "ZCPC3_7":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpc.zcpc3_7Value = that.setFormat(3, data[2]);
              break;
            case "ZCPC3_8":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpc.zcpc3_8Value = that.setFormat(3, data[2]);
              break;
            case "ZCPC3_9":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpc.zcpc3_9Value = that.setFormat(3, data[2]);
              break;

            case "ZCPC4_1":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpc.zcpc4_1Value = that.setFormat(3, data[2]);
              break;
            case "ZCPC4_2":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpc.zcpc4_2Value = that.setFormat(3, data[2]);
              break;
            case "ZCPC4_3":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpc.zcpc4_3Value = that.setFormat(3, data[2]);
              break;
            case "ZCPC4_4":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpc.zcpc4_4Value = that.setFormat(3, data[2]);
              break;
            case "ZCPC4_5":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpc.zcpc4_5Value = that.setFormat(3, data[2]);
              break;
            case "ZCPC4_6":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpc.zcpc4_6Value = that.setFormat(3, data[2]);
              break;
            case "ZCPC4_7":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpc.zcpc4_7Value = that.setFormat(3, data[2]);
              break;
            case "ZCPC4_8":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpc.zcpc4_8Value = that.setFormat(3, data[2]);
              break;
            case "ZCPC4_9":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpc.zcpc4_9Value = that.setFormat(3, data[2]);
              break;

            case "ZCPC5_1":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpc.zcpc5_1Value = that.setFormat(3, data[2]);
              break;
            case "ZCPC5_2":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpc.zcpc5_2Value = that.setFormat(3, data[2]);
              break;
            case "ZCPC5_3":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpc.zcpc5_3Value = that.setFormat(3, data[2]);
              break;
            case "ZCPC5_4":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpc.zcpc5_4Value = that.setFormat(3, data[2]);
              break;
            case "ZCPC5_5":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpc.zcpc5_5Value = that.setFormat(3, data[2]);
              break;
            case "ZCPC5_6":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpc.zcpc5_6Value = that.setFormat(3, data[2]);
              break;
            case "ZCPC5_7":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpc.zcpc5_7Value = that.setFormat(3, data[2]);
              break;
            case "ZCPC5_8":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpc.zcpc5_8Value = that.setFormat(3, data[2]);
              break;
            case "ZCPC5_9":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpc.zcpc5_9Value = that.setFormat(3, data[2]);
              break;

            case "ZCPC6_1":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpc.zcpc6_1Value = that.setFormat(3, data[2]);
              break;
            case "ZCPC6_2":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpc.zcpc6_2Value = that.setFormat(3, data[2]);
              break;
            case "ZCPC6_3":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpc.zcpc6_3Value = that.setFormat(3, data[2]);
              break;
            case "ZCPC6_4":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpc.zcpc6_4Value = that.setFormat(3, data[2]);
              break;
            case "ZCPC6_5":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpc.zcpc6_5Value = that.setFormat(3, data[2]);
              break;
            case "ZCPC6_6":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpc.zcpc6_6Value = that.setFormat(3, data[2]);
              break;
            case "ZCPC6_7":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpc.zcpc6_7Value = that.setFormat(3, data[2]);
              break;
            case "ZCPC6_8":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpc.zcpc6_8Value = that.setFormat(3, data[2]);
              break;
            case "ZCPC6_9":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpc.zcpc6_9Value = that.setFormat(3, data[2]);
              break;

            case "ZCPC7_1":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpc.zcpc7_1Value = that.setFormat(3, data[2]);
              break;
            case "ZCPC7_2":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpc.zcpc7_2Value = that.setFormat(3, data[2]);
              break;
            case "ZCPC7_3":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpc.zcpc7_3Value = that.setFormat(3, data[2]);
              break;
            case "ZCPC7_4":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpc.zcpc7_4Value = that.setFormat(3, data[2]);
              break;
            case "ZCPC7_5":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpc.zcpc7_5Value = that.setFormat(3, data[2]);
              break;
            case "ZCPC7_6":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpc.zcpc7_6Value = that.setFormat(3, data[2]);
              break;
            case "ZCPC7_7":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpc.zcpc7_7Value = that.setFormat(3, data[2]);
              break;
            case "ZCPC7_8":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpc.zcpc7_8Value = that.setFormat(3, data[2]);
              break;
            case "ZCPC7_9":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpc.zcpc7_9Value = that.setFormat(3, data[2]);
              break;

            case "ZCPC8_1":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpc.zcpc8_1Value = that.setFormat(3, data[2]);
              break;
            case "ZCPC8_2":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpc.zcpc8_2Value = that.setFormat(3, data[2]);
              break;
            case "ZCPC8_3":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpc.zcpc8_3Value = that.setFormat(3, data[2]);
              break;
            case "ZCPC8_4":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpc.zcpc8_4Value = that.setFormat(3, data[2]);
              break;
            case "ZCPC8_5":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpc.zcpc8_5Value = that.setFormat(3, data[2]);
              break;
            case "ZCPC8_6":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpc.zcpc8_6Value = that.setFormat(3, data[2]);
              break;
            case "ZCPC8_7":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpc.zcpc8_7Value = that.setFormat(3, data[2]);
              break;
            case "ZCPC8_8":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpc.zcpc8_8Value = that.setFormat(3, data[2]);
              break;
            case "ZCPC8_9":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpc.zcpc8_9Value = that.setFormat(3, data[2]);
              break;

            case "ZCPC9_1":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpc.zcpc9_1Value = that.setFormat(3, data[2]);
              break;
            case "ZCPC9_2":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpc.zcpc9_2Value = that.setFormat(3, data[2]);
              break;
            case "ZCPC9_3":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpc.zcpc9_3Value = that.setFormat(3, data[2]);
              break;
            case "ZCPC9_4":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpc.zcpc9_4Value = that.setFormat(3, data[2]);
              break;
            case "ZCPC9_5":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpc.zcpc9_5Value = that.setFormat(3, data[2]);
              break;
            case "ZCPC9_6":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpc.zcpc9_6Value = that.setFormat(3, data[2]);
              break;
            case "ZCPC9_7":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpc.zcpc9_7Value = that.setFormat(3, data[2]);
              break;
            case "ZCPC9_8":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpc.zcpc9_8Value = that.setFormat(3, data[2]);
              break;
            case "ZCPC9_9":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zcpc.zcpc9_9Value = that.setFormat(3, data[2]);
              break;

            case "ZPPC1":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zppc.zppc1Value = that.setFormat(3, data[2]);
              break;
            case "ZPPC2":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zppc.zppc2Value = that.setFormat(3, data[2]);
              break;
            case "ZPPC3":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zppc.zppc3Value = that.setFormat(3, data[2]);
              break;
            case "ZPPC4":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zppc.zppc4Value = that.setFormat(3, data[2]);
              break;
            case "ZPPC5":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zppc.zppc5Value = that.setFormat(3, data[2]);
              break;
            case "ZPPC6":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zppc.zppc6Value = that.setFormat(3, data[2]);
              break;
            case "ZPPC7":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zppc.zppc7Value = that.setFormat(3, data[2]);
              break;
            case "ZPPC8":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zppc.zppc8Value = that.setFormat(3, data[2]);
              break;
            case "ZPPC9":
              if (isNaN(data[2])) {
                MessageBox.show("Dato no válido para el campo 'Valor' en la línea: " + (i + 1), '20em', MessageBox.Icon.ERROR, "Ok");
                BusyIndicator.hide();
                return;
              }
              object.zppc.zppc9Value = that.setFormat(3, data[2]);
              break;
            default:
              MessageBox.show("Código " + data[3] + " NO reconocido, favor de revisar la linea " + (i + 1) + " del excel", MessageBox.Icon.ERROR, "Ok");
              BusyIndicator.hide();
              return;
          }

        }
        //Funcionalidad para cargar los datos:
        let listMatnr = [];
        let matnrInArmados = "";
        for (let j in listArmados) {
          let obj = new Object();
          obj.matnr = listArmados[j].matnr;
          listMatnr.push(obj);
          let alreadyInArmados = false;
          for (let k in that.systemClassData) {
            if (listArmados[j].matnr == that.systemClassData[k].matnr) {
              alreadyInArmados = true;
              break;
            }
          }
          if (alreadyInArmados) {
            if (matnrInArmados == "") {
              matnrInArmados = listArmados[j].matnr;
            } else {
              matnrInArmados += "\n" + listArmados[j].matnr;
            }
          }
        }

        if (matnrInArmados != "") {
          MessageBox.show("Los siguientes materiales ya se encuentran en el sistema de clasificación: \n" + matnrInArmados +
            "\nEstos materiales se pueden encontrar y editar en el tab de 'Armados'\nFavor de quitarlos del archivo e intente la carga nuevamente",
            { icon: MessageBox.Icon.ERROR, title: "Carga de archivo", id: "centrado", styleClass: "centrado" });
          BusyIndicator.hide();
          return;
        }

        let validatedList = undefined;
        try {
          validatedList = await that.execValidateMatnr(listMatnr);
        } catch (e) {
          MessageBox.show(e.toString(), MessageBox.Icon.ERROR, "Carga de archivo");
          BusyIndicator.hide();
          return;
        }


        let matnrMissing = "";
        for (let i in listMatnr) {
          let foundMatnr = false;
          for (let j in validatedList) {
            if (listMatnr[i].matnr == validatedList[j].matnr) {
              foundMatnr = true;
              break;
            }
          }
          if (!foundMatnr) {
            if (matnrMissing == "") {
              matnrMissing = listMatnr[i].matnr;
            } else {
              matnrMissing += "\n" + listMatnr[i].matnr;
            }
          }
        }
        if (matnrMissing != "") {
          let SAP = "";
          if (country == "MX") {
            SAP = "México";
          } else if (country == "CO") {
            SAP = "COPEC";
          }
          MessageBox.show("Los siguientes materiales NO existen en SAP " + SAP + ": \n" + matnrMissing +
            "\nFavor de corregirlos o quitarlos del archivo e intente la carga nuevamente",
            { icon: MessageBox.Icon.ERROR, title: "Carga de archivo", id: "centrado", styleClass: "centrado" });
          BusyIndicator.hide();
          return;
        }

        that.UploadFile = true;
        that.execSetArmadosInve(listArmados, "Carga de archivo");
      }

      function errorHandler(evt) {

        if (evt.target.error.name == "NotReadableError") {
          MessageBox.show("No se puede leer el archivo.", MessageBox.Icon.ERROR, "Carga de archivo");
          BusyIndicator.hide();
        }

      }

      $('#fileArmados').val("");
    },

    setInstructionsForFileArmados: function () {
      let msg = "EJEMPLO DE LLENADO DE PLANTILLA\n\nAl descargar el archivo, podremos observar que se visualizan cuatro campos:" +
        "\n1. Material\n2. Descripción Armado\n3. Valor\n4. Código" +
        "\n\nEn 'Material', colocaremos el SKU del material al que se le desea añadir el armado." +
        "\nLa 'Descripción Armado' es para referencia del usuario al momento de ubicar los armados." +
        "\nEn 'Valor', colocaremos la cantidad correspondiente al armado deseado." +
        "\n\nRespecto al código:\nSe pueden tener dos diferentes formatos:\n-ZCPP#   Correspondiente a camas por pallet\n-ZCPC#_#   Correspondiente a cajas por cama" +
        "\n\nSustituyendo los # por valores númericos referente a los armados relacionado. Es decir, como ejemplo:" +
        "\n\n3000005	Camas por Pallet 1	6	ZCPP1\n3000005	Cajas por Cama 1_1	11	ZCPC1_1" +
        "\n\nCada ZCPP# puede tener hasta 9 variantes, es decir de ZCPC#_1 hasta ZCPC#_9" +
        "\n\nContinuando con el ejemplo, si quisieramos que '3000005' tenga tres armados diferentes, tendríamos que llenarlos de la siguiente forma:" +
        "\n\n3000005	Camas por Pallet 1	6	ZCPP1\n3000005	Cajas por Cama 1_1	11	ZCPC1_1\n3000005	Cajas por Cama 1_1	12	ZCPC1_2" +
        "\n3000005	Camas por Pallet 2	5	ZCPP2\n3000005	Cajas por Cama 2_1	11	ZCPC2_1\n3000005	Camas por Pallet 3	7	ZCPP3" +
        "\n3000005	Cajas por Cama 3_1	11	ZCPC3_1" +
        "\n\nEn caso de que el armado contenga 'piezas por caja', se deberá poner su respectivo valor o valores en la sección correspondiente:" +
        "\n3000005 Piezas por Caja 1 5 ZPPC1\n3000005 Piezas por Caja 1 7 ZPPC2" +
        "\n\n'Piezas por caja' puede tener hasta nueve variantes, es decir de ZPPC1 a ZPPC9 en el mismo material." +
        "\n\nNOTAS IMPORTANTES:" +
        "\n-Los valores aceptados son sólo numéricos (con hasta tres decimales)" +
        "\n-Se puede añadir uno o más materiales en la misma plantilla." +
        "\n-No se permiten cargar materiales ya existentes en el sistema de clasificación. Éstos se podrán modificar en el tab 'Armados'." +
        "\n-El material a cargar debe existir en SAP, de lo contrario se mostrará un aviso de que dicho material no fue encontrado.";
      this.byId("txtAreaAttch").setValue(msg);
    },

    _onSearchBD: function (oEvent) {
      let sQuery = oEvent.getSource().getValue().trim();
      let oFilter = new Filter({
        filters: [

          new Filter("object", FilterOperator.Contains, sQuery),
          new Filter("maktx", FilterOperator.Contains, sQuery)
        ],
        and: false
      });
      let oBinding = this.byId("tblBD").getBinding("items");
      oBinding.filter(oFilter, FilterType.Application);
    }

  });
}, /* bExport= */ true);
