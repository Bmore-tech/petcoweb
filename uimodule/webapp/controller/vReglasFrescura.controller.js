sap.ui.define(
	[
	  "com/bmore/inveweb/controller/BaseController",
	  "sap/ui/model/json/JSONModel",
	  "sap/m/MessageBox",
	  "sap/m/Dialog",
	  "sap/m/Button",
	  "sap/ui/core/BusyIndicator",
      'sap/m/Input',
      'sap/m/Label',
      "sap/ui/core/MessageType",
      "sap/ui/model/Filter",
      "sap/ui/model/FilterOperator",
      "sap/ui/model/FilterType",
	],
	function (Controller,JSONModel,MessageBox,Dialog,Button,BusyIndicator,Input,Label,MessageType,Filter,FilterOperator,FilterType) {
	  "use strict";
  
	  return Controller.extend("com.bmore.inveweb.controller.vReglasFrescura", {

        onInit:function(){
            this.showLog=false;
            this.getView().setModel(new JSONModel([]),"oModelCanal");
            this.getView().setModel(new JSONModel([]),"oModelReglas");
            this.getSkuCanales();
            this.getReglas();
        },
        getSkuCanales:async function(){
            const json = await this.execService(InveServices.GET_SKU_CANALES,{},"getSkuCanales",this.showLog);
            console.log("canales",json.lsObject);
            this.getView().setModel(new JSONModel(json.lsObject),"oModelCanal");
        },
        getReglas:async function(){
            const json = await this.execService(InveServices.GET_REGLAS_FRESCURA,{},"getReglasFrescura",this.showLog);
            console.log("reglas",json.lsObject);
            this.getView().setModel(new JSONModel(json.lsObject),"oModelReglas");
        },
        modalViewAdd: function (evt) {
            if (!this.oDialogAlta) {
      
              this.oDialogAlta = new Dialog({
                id: 'oDialogAlta', // ID
                title: "Alta material - canal", // string
                contentWidth: "20%", // CSSSize,
                content: [new Label ({text:"Material"}).addStyleClass("sapUiTinyMarginBegin sapUiTinyMarginEnd"),
                            new Input("inputMatnr", { width: "95%", type: "Text" }).addStyleClass("sapUiTinyMarginBegin sapUiTinyMarginEnd"),
                            new Label ({text:"Canal"}).addStyleClass("sapUiTinyMarginBegin sapUiTinyMarginEnd"),
                            new Input("inputCanal", { width: "95%", type: "Text" }).addStyleClass("sapUiTinyMarginBegin sapUiTinyMarginEnd")
                ], // Control
                beginButton: new Button({
                  text: 'Aceptar',
                  type: "Accept",
                  press: function () {
                   let matnr = sap.ui.getCore().byId("inputMatnr").getValue().trim();
                   let canal = sap.ui.getCore().byId("inputCanal").getValue().trim();
                    if(matnr != null & matnr != ""
                        && canal != null && canal != ""){
                            this.saveRecord(matnr,canal);
                    }else{
                        MessageBox.show('Los campos "material" y "canal" no pueden ser vacios ',
								MessageBox.Icon.ERROR, "Falta Información");
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
            sap.ui.getCore().byId("inputMatnr").setValue("");
            sap.ui.getCore().byId("inputCanal").setValue("");
            this.oDialogAlta.open();
          },
          saveRecord:async function(matnr,canal){

            const request = {
              tokenObject: null,
              lsObject: {
                  matnr:matnr,
                  canal:canal
              }
            };
            this.oDialogAlta.close();

            const json = await this.execService(InveServices.SAVE_SKU_CANAL, request, "saveSkuCanal", this.showLog);

            if (json) {
              BusyIndicator.hide();
              this.message("Material - Canal guardado exitosamente", MessageType.Success,this.byId("messagesBox"),this.byId("vbFrame"),this.byId("pReglasFrescura"));
              setTimeout(function () {
                this.byId("messagesBox").getItems()[0].close();
              }.bind(this), 4000);
            }
          },
          initRemoveSKUCanal:function(){
            if(this.byId("btnDelete").getText() == "Cancelar"){
                this.byId("btnRefresh").setVisible(true);
                this.byId("btnSave").setVisible(false);
                this.byId("btnAdd").setVisible(true);
                this.byId("oTableSKUCanal").setModel(new JSONModel(this.backupoModelCanal),"oModelCanal");
                this.byId("oTableSKUCanal").setMode("None");
                this.byId("btnDelete").setText("Eliminar");
                this.byId("btnDelete").setIcon("sap-icon://less");
            }else{
                this.byId("btnAdd").setVisible(false);
                this.byId("btnRefresh").setVisible(false);
                this.byId("btnSave").setVisible(true);
                this.byId("btnDelete").setText("Cancelar");
                this.byId("btnDelete").setIcon("sap-icon://cancel");
                this.backupoModelCanal = this.copyObjToNew(this.byId("oTableSKUCanal").getModel("oModelCanal").getData());
                this.byId("oTableSKUCanal").setMode("Delete");
                this.skuCanalRemove = []; 
            }
            			
          },
          selectRemoveSKUCanal:function(evt){
            let path = evt.getParameter('listItem').getBindingContext("oModelCanal").getPath();
            let idx = parseInt(path.substring(path.lastIndexOf('/') +1));
            let m = evt.getSource().getModel("oModelCanal");
            
            let d = m.getData();
            this.skuCanalRemove.push(d[idx]);
            d.splice(idx, 1);
            m.setData(d);
          },
          execDeleteSKUCanal: async function(){
            if(this.skuCanalRemove == undefined || this.skuCanalRemove.length == 0){
                MessageBox.show('No hay registros seleccionados para borrar',
                MessageBox.Icon.WARNING, "Advertencia");
                 return;
            }
            
            const request = {
                tokenObject : null,
                lsObject : this.skuCanalRemove
            }
            const json = await this.execService(InveServices.DELETE_SKU_CANAL,request,"deleteSkuCanal",this.showLog);

            if(json){
                let message = 'Registros borrados exitosamente'; 
                this.message(message, MessageType.Success,this.byId("messagesBox"),this.byId("vbFrame"),this.byId("pReglasFrescura"));
                this.byId("btnDelete").setText("Eliminar");
                this.byId("btnDelete").setIcon("sap-icon://less");
                this.byId("btnAdd").setVisible(true);
                this.byId("btnRefresh").setVisible(true);
                this.byId("btnSave").setVisible(false);
                this.byId("oTableSKUCanal").setMode("None");
                await this.getSkuCanales();
                
                setTimeout(function() {
                    this.byId("messagesBox").getItems()[0].close();  
                }.bind(this),5000); 
            }
          },
          refreshSKUCanal:function(){
            this.getSkuCanales();
          },
          filterTableSKUCanal:function(oEvent){
            let value = oEvent.getSource().getValue();
            let allFilter = new Filter([
                                        new Filter("matnr",  FilterOperator.Contains, value),
                                        new Filter("canal",  FilterOperator.Contains, value)
                                    ]);        
            let oTable = oEvent.getSource().getParent().getParent();

            oTable.getBinding("items").filter(allFilter, FilterType.Application);

          },
          ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
          modalViewAddEstatusPT: function (evt) {
            if (!this.oDialogAltaEstatusPT) {
      
              this.oDialogAltaEstatusPT = new Dialog({
                id: 'oDialogAltaEstatusPT', // ID
                title: "Alta de Regla", // string
                contentWidth: "20%", // CSSSize,
                content: [new Label ({text:"Canal"}).addStyleClass("sapUiTinyMarginBegin sapUiTinyMarginEnd"),
                            new Input("inputCanalR", { width: "95%", type: "Text" }).addStyleClass("sapUiTinyMarginBegin sapUiTinyMarginEnd"),
                            new Label ({text:"Intervalo Inicial"}).addStyleClass("sapUiTinyMarginBegin sapUiTinyMarginEnd"),
                            new Input("inputII", { width: "95%", type: "Number" }).addStyleClass("sapUiTinyMarginBegin sapUiTinyMarginEnd"),
                            new Label ({text:"Intervalo Final"}).addStyleClass("sapUiTinyMarginBegin sapUiTinyMarginEnd"),
                            new Input("inputIF", { width: "95%", type: "Number" }).addStyleClass("sapUiTinyMarginBegin sapUiTinyMarginEnd"),
                            new Label ({text:"Estatus PT"}).addStyleClass("sapUiTinyMarginBegin sapUiTinyMarginEnd"),
                            new Input("inputEstatus", { width: "95%", type: "Text" }).addStyleClass("sapUiTinyMarginBegin sapUiTinyMarginEnd")
                ], // Control
                beginButton: new Button({
                  text: 'Aceptar',
                  type: "Accept",
                  press: function () {
                   let canal = sap.ui.getCore().byId("inputCanalR").getValue().trim();
                   let ii = sap.ui.getCore().byId("inputII").getValue().trim();
                   let inf = sap.ui.getCore().byId("inputIF").getValue().trim();
                   let estatus = sap.ui.getCore().byId("inputEstatus").getValue().trim();
                    if(ii != null & ii != ""
                        && canal != null && canal != ""
                            && inf != null && inf != ""
                                && estatus != null && estatus != ""){
                            this.saveRecordEstatusPT(canal,ii,inf,estatus);
                    }else{
                        MessageBox.show('Los 4 campos son necesarios ',
								MessageBox.Icon.ERROR, "Falta Información");
                    }
                  }.bind(this)
                }),
                endButton: new Button({
                  text: 'Cancelar',
                  type: "Reject",
                  press: function () {
                    this.oDialogAltaEstatusPT.close();
                  }.bind(this)
                })
              });
            }
            this.oDialogAltaEstatusPT.addStyleClass("sapUiTinyMarginBegin sapUiTinyMarginEnd");
            sap.ui.getCore().byId("inputCanalR").setValue("");
            sap.ui.getCore().byId("inputII").setValue("");
            sap.ui.getCore().byId("inputIF").setValue("");
            sap.ui.getCore().byId("inputEstatus").setValue("");
            this.oDialogAltaEstatusPT.open();
          },
          saveRecordEstatusPT:async function(canal,ii,inf,estatus){

            const request = {
              tokenObject: null,
              lsObject: {
                canal:canal,
                lapsoInicial:ii,
                lapsoFinal:inf,
                estatusPt:estatus
              }
            };
            this.oDialogAltaEstatusPT.close();

            const json = await this.execService(InveServices.SAVE_REGLAS_FRESCURA, request, "saveReglasFrescura", this.showLog);

            if (json) {
              BusyIndicator.hide();
              this.message("Regla guardada exitosamente", MessageType.Success,this.byId("messagesBox"),this.byId("vbFrame"),this.byId("pReglasFrescura"));
              setTimeout(function () {
                this.byId("messagesBox").getItems()[0].close();
              }.bind(this), 4000);
            }
          },
          initRemoveEstatusPT:function(){
            if(this.byId("btnDeleteEstatusPT").getText() == "Cancelar"){
                this.byId("btnRefreshEstatusPT").setVisible(true);
                this.byId("btnSaveEstatusPT").setVisible(false);
                this.byId("btnAddEstatusPT").setVisible(true);
                this.byId("oTableReglas").setModel(new JSONModel(this.backupoModelReglas),"oModelReglas");
                this.byId("oTableReglas").setMode("None");
                this.byId("btnDeleteEstatusPT").setText("Eliminar");
                this.byId("btnDeleteEstatusPT").setIcon("sap-icon://less");
            }else{
                this.byId("btnAddEstatusPT").setVisible(false);
                this.byId("btnRefreshEstatusPT").setVisible(false);
                this.byId("btnSaveEstatusPT").setVisible(true);
                this.byId("btnDeleteEstatusPT").setText("Cancelar");
                this.byId("btnDeleteEstatusPT").setIcon("sap-icon://cancel");
                this.backupoModelReglas = this.copyObjToNew(this.byId("oTableReglas").getModel("oModelReglas").getData());
                this.byId("oTableReglas").setMode("Delete");
                this.skuReglasRemove = []; 
            }
            			
          },
          selectRemoveEstatusPT:function(evt){
            let path = evt.getParameter('listItem').getBindingContext("oModelReglas").getPath();
            let idx = parseInt(path.substring(path.lastIndexOf('/') +1));
            let m = evt.getSource().getModel("oModelReglas");
            
            let d = m.getData();
            this.skuReglasRemove.push(d[idx]);
            d.splice(idx, 1);
            m.setData(d);
          },
          execDeleteEstatusPT: async function(){
            if(this.skuReglasRemove == undefined || this.skuReglasRemove.length == 0){
                MessageBox.show('No hay registros seleccionados para borrar',
                MessageBox.Icon.WARNING, "Advertencia");
                 return;
            }
            
            const request = {
                tokenObject : null,
                lsObject : this.skuReglasRemove
            }
            const json = await this.execService(InveServices.DELETE_REGLAS_FRESCURA,request,"deleteReglasFrescura",this.showLog);

            if(json){
                let message = 'Registros borrados exitosamente'; 
                this.message(message, MessageType.Success,this.byId("messagesBox"),this.byId("vbFrame"),this.byId("pReglasFrescura"));
                this.byId("btnDeleteEstatusPT").setText("Eliminar");
                this.byId("btnDeleteEstatusPT").setIcon("sap-icon://less");
                this.byId("btnAddEstatusPT").setVisible(true);
                this.byId("btnRefreshEstatusPT").setVisible(true);
                this.byId("btnSaveEstatusPT").setVisible(false);
                this.byId("oTableReglas").setMode("None");
                await this.getReglas();
                
                setTimeout(function() {
                    this.byId("messagesBox").getItems()[0].close();  
                }.bind(this),5000); 
            }
          },
          refreshEstatusPT:function(){
            this.getReglas();
          },
          filterTableEstatusPT:function(oEvent){
            let value = oEvent.getSource().getValue();
            let allFilter = new Filter([
                                        new Filter("canal",  FilterOperator.Contains, value),
                                        new Filter("estatusPt",  FilterOperator.Contains, value)
                                    ]);        
            let oTable = oEvent.getSource().getParent().getParent();

            oTable.getBinding("items").filter(allFilter, FilterType.Application);

          }
      });
    });