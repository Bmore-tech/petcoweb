sap.ui.define(
	[
	  "com/bmore/inveweb/controller/BaseController",
	  "sap/ui/model/json/JSONModel",
	  "sap/ui/core/BusyIndicator",
	  "sap/ui/core/Fragment",
	  "sap/ui/model/Filter",
	  "sap/ui/model/FilterOperator",
	  "sap/ui/model/FilterType",
	  "sap/m/MessageBox",
	],
	function (Controller,JSONModel,BusyIndicator,Fragment,Filter,FilterOperator,FilterType,MessageBox) {
	  "use strict";
  
	  return Controller.extend("com.bmore.inveweb.controller.vAssignMaterial", {
	onInit: function() {
		//Code to execute every time view is displayed
		this.getView().addDelegate({
				
			onBeforeShow: function(evt) { 
				BusyIndicator.hide();
				
				let zoneId = sap.ui.getCore().byId('container-inveweb---vZone--zoneId').getValue()
				if(zoneId.length > 0){
					
					let onEdit = sap.ui.getCore().byId('container-inveweb---vZone--bSave').getEnabled();
					this.byId("bAddMaterial").setEnabled(onEdit);
					this.byId("bDeleteMaterial").setEnabled(onEdit);
				}else{
					this.byId("bAddMaterial").setEnabled(true);
					this.byId("bDeleteMaterial").setEnabled(true);
				}				
				this.setData(sap.ui.getCore().byId('container-inveweb---vZone').getController().row);			
	        }.bind(this)
	    });
	},
	
	setData: function(row){
		
		if(this.getOnEdit()){
			this.byId("bAddMaterial").setEnabled(true);
			this.byId("bDeleteMaterial").setEnabled(true);			
		}else{
			this.byId("bAddMaterial").setEnabled(false);
			this.byId("bDeleteMaterial").setEnabled(false);
		}					
		let zoneId = sap.ui.getCore().byId('container-inveweb---vZone--zoneId').getValue();
		this.byId("zoneId").setText(zoneId);
		let description = sap.ui.getCore().byId('container-inveweb---vZone--description').getValue();
		this.byId("description").setText(description);
		let society = sap.ui.getCore().byId('container-inveweb---vZone--bukrs').getSelectedItem().getText();
		this.byId("society").setText(society);
		let center = sap.ui.getCore().byId('container-inveweb---vZone--werks').getSelectedItem().getText();
		this.byId("center").setText(center);	
		this.byId("positionId").setText(row.pkAsgId);
		let lgort = sap.ui.getCore().byId('container-inveweb---vZone--lgort').getSelectedItem().getText();
		this.byId("depotId").setText(lgort);	
		this.byId("lgtyp").setText(row.lgtyp);
		this.byId("lgpla").setText(row.lgpla);
		this.byId("imwm").setText(row.imwm);
		this.byId("sequence").setText(row.secuency);
		this.row = row;		
		let data;
		
		try {
			data = JSON.parse(JSON.stringify(row.materials));
		} catch (e) {
			data = [];
		}
						
		this.modelAssignMatnr = new JSONModel(data);
		this.byId("oAssignMatnrTable").setModel(this.modelAssignMatnr, "modelAssignMatnr");
		this.byId("oAssignMatnrTable").getModel("modelAssignMatnr").refresh(true);
						
	},
	
	cleanAll: function(){
		
		this.cleanView();
		sap.ui.getCore().byId('container-inveweb---vZone').getController().cleanView();		
	},
	
	cleanView: function(){
		
		this.byId("zoneId").setText("");
		this.byId("description").setText("");
		this.byId("society").setText("");
		this.byId("center").setText("");	
		this.byId("positionId").setText("");
		this.byId("depotId").setText("");	
		this.byId("lgtyp").setText("");
		this.byId("lgpla").setText("");
		this.byId("imwm").setText("");
		this.byId("sequence").setText("");
		
		setTimeout(function(){
			
		    this.byId("matnr").setSorted(false);
		    this.byId("descM").setSorted(false);
		}.bind(this),50);	

		this.modelAssignMatnr.setProperty("/",[]);
		this.getView().getModel("modelAssignMatnr").refresh(true);
	},
		
			
	returnAction : function() {
		
		let data;
		try {
			data = this.byId("oAssignMatnrTable").getModel("modelAssignMatnr").getData();
		} catch (e) {
			data = [];
		}
		this.row.materials = data;
		
		sap.ui.getCore().byId('container-inveweb---vZone').getController().flag = true;
		
		window.history.go(-1);
	},
				
	selectRow: function(oEvent){
				
		let index = oEvent.getParameter("rowIndex");
		try {
			this.byId("oTable").setSelectedIndex(index);
		} catch (e) {
			console.log(e);
		}		
	},
		
	addMaterial: function(){
		let oView = this.getView();
            if (!this.byId("oDialogTableMaterial")) {
    
                Fragment.load({
                    id: oView.getId(),
                    name: "com.bmore.inveweb.view.fragments.vMCMaterial",
                    controller: this
                  }).then(function(oDialog){
                    oView.addDependent(oDialog);
					this.cleanOdialog();
					if(!this.LOADED_MATNR){			
						let oTableMaterial = this.frgById("oTableMaterial");	
						oTableMaterial.setModel(new JSONModel([]), "tableMaterialModel");
						this.loadMaterial();
						this.LOADED_MATNR = true;
					}
                    oDialog.open();
                  }.bind(this));
            }else{
                this.cleanOdialog();
				if(!this.LOADED_MATNR){			
					let oTableMaterial = this.frgById("oTableMaterial");	
					oTableMaterial.setModel(new JSONModel([]), "tableMaterialModel");
					this.loadMaterial();
					this.LOADED_MATNR = true;
				}
                this.byId("oDialogTableMaterial").open();
            }	
	},
	_closeDialog:function(){
		this.byId("oDialogTableMaterial").close();
	},

	cleanOdialog: function(){
		
		let fSearchMaterial = this.frgById("fSearchMaterial");
		fSearchMaterial.setValue("");		
	},
	frgById:function(id){
		return Fragment.byId(this.getView().getId(), id);
	},
	loadMaterial: async function(){
		
		let search = this.frgById("fSearchMaterial");
		search.setEnabled(false);
		let oTableMaterial = this.frgById("oTableMaterial");

		let matnrBeanView = new Object();
		matnrBeanView.werks = sap.ui.getCore().byId('container-inveweb---vZone--werks').getSelectedKey();
		matnrBeanView.matnr = "";
		matnrBeanView.maktx = "";	

		const request = {
			tokenObject: null,
			lsObject: matnrBeanView
		};

		const json = await this.execService(InveServices.GET_MATNR,request,"loadMaterial",this.showLog);
		if(json){
			//Create a model and bind the table rows to this model	
			oTableMaterial.setModel(new JSONModel(json.lsObject), "tableMaterialModel");
			search.setEnabled(true);
			//BusyIndicator.hide();
		}

	},
	filterMaterial: function(oEvent){
		let sQuery = oEvent.getSource().getValue();
		let oFilter = new Filter({
		  filters: [
			new Filter("matnr", FilterOperator.Contains, sQuery),
			new Filter("maktx", FilterOperator.Contains, sQuery)
		  ],
		  and: false
		});
		let oBinding =  this.frgById("oTableMaterial").getBinding("items");
		try {
			oBinding.filter(oFilter, FilterType.Application);
		} catch (e) {
			console.warn(e);
		}
		
	},
	selectMaterial: function(oEvent){
		let oTableMaterial = this.frgById("oTableMaterial");
		let item = oTableMaterial.getSelectedItems();
		let cells = item[0].getCells();
		
		let entry = new Object();
		entry.matnr = cells[0].getText();
		entry.descM = cells[1].getText();
		let data;
				
		try {
			data = this.byId("oAssignMatnrTable").getModel("modelAssignMatnr").getData();
		} catch (e) {
			data = [];						
		}
		
		for(let i = 0; i < data.length; i++){
			
			if(data[i].matnr == entry.matnr){	        			
				MessageBox.show('El material ya se encuentra asignado.',
						MessageBox.Icon.ERROR, "Duplicado");
				
				return;
			}
		}
		
		data.push(entry);		
		let oModel = new JSONModel(data);
		
		this.byId("oAssignMatnrTable").setModel(oModel,"modelAssignMatnr");
		this.byId("oAssignMatnrTable").getModel("modelAssignMatnr").refresh(true);
		this._closeDialog();		
	},
	
	removeMaterial: function(){
		
		let oTable = this.getView().byId('oAssignMatnrTable');  		
        let selectedItems = oTable.getSelectedItems();
        
        if(selectedItems.length > 0){
        	
        	//Empty backup record
    		this.backupRecord = {};
    					        		
    		//Delete data
			let arr = [];
    		let data = oTable.getModel("modelAssignMatnr").getData();
    		
    		for(let i in oTable.getItems()){
    			if(selectedItems.indexOf(oTable.getItems()[i]) == -1 ){
					arr.push(data[i]);
				}			    			        			
    		}

			
			let oModel = new JSONModel(arr);
			oTable.setModel(oModel,"modelAssignMatnr");
			oTable.getModel("modelAssignMatnr").refresh(true);
    		
        }else{
        	this.toast("Nada que eliminar", "20em");
        }
	}
});
}
);