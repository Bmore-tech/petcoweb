sap.ui.define(
	[
	  "com/bmore/inveweb/controller/BaseController",
	  "sap/ui/core/BusyIndicator",
	  "sap/ui/model/json/JSONModel",
	  "sap/m/MessageToast",
	  "sap/m/MessageBox",
      "sap/ui/model/Filter",
	  "sap/ui/core/Fragment",
	  "sap/ui/model/FilterOperator",
	  "sap/ui/model/FilterType",
      
	],
	function (Controller,BusyIndicator,JSONModel,
                    MessageToast,MessageBox,Filter,Fragment,FilterOperator,FilterType) {
	  "use strict";
  
	  return Controller.extend("com.bmore.inveweb.controller.vRepository", {
        onInit: function() {
		// Code to execute every time view is displayed
		this.getView().addDelegate({
			onBeforeShow: function(evt) {
                this.TECHNICAL_ADMIN = this.roleExists("INVE_TECH_ADMIN");
				if(this.TECHNICAL_ADMIN){
					this.byId("bNew").setVisible(true);
					this.byId("bEdit").setVisible(true);
					this.byId("bCancel").setVisible(true);
					this.byId("bSave").setVisible(true);
					this.byId("bDelete").setVisible(true);	
				}else{
					this.byId("bNew").setVisible(false);
					this.byId("bEdit").setVisible(false);
					this.byId("bCancel").setVisible(false);
					this.byId("bSave").setVisible(false);
					this.byId("bDelete").setVisible(false);
				}
				let items = this.byId("oTable").getSelectedItems();
				if(items.length == 0){
					this.byId("bEdit").setEnabled(false);
				}else{
					this.byId("bEdit").setEnabled(true);
				}
				this.oModel = new JSONModel({
                properties: []
            });
		
		this.getView().setModel(this.oModel, "oModel");  
		this.cleanView();
		this.loadOptionsP();
	        }.bind(this)
	    });

	},


		
	returnAction : function() {
		
		this.flag = false;
		window.history.back();

		
	},
	
	cleanView: function(){
		
		this.byId("bNew").setEnabled(true);
		this.byId("bEdit").setEnabled(false);
		this.byId("bCancel").setEnabled(false);
		this.byId("bSave").setEnabled(false);
		this.byId("bDelete").setEnabled(false);		
		this.byId("fSearch").setValue("");
		
		// Empty table
		let oModel = new JSONModel();
		oModel.setData({modelData: []});
		
		let oTable = this.byId("oTable");
		oTable.setModel(oModel);
		/* oTable.bindRows("/modelData"); */
		
		
		
	},
	
	getData: function(){

		let oTable = this.byId('oTable');  		
        let selectedItems = oTable.getSelectedIndices();
        
        if(selectedItems.length == 1){//Display the unique record
        	
        	//Set the initial state for controls
			let bNew = this.byId("bNew");
			bNew.setEnabled(true);			
			let bEdit = this.byId("bEdit");
			bEdit.setEnabled(true);
			let bCancel = this.byId("bCancel");
    		bCancel.setEnabled(false);
    		let bSave = this.byId("bSave");
    		bSave.setEnabled(false);
			let bDelete = this.byId("bDelete");
			bDelete.setEnabled(true);
    		
    		//Disable controls & set values
			let sPath = oTable.getContextByIndex(selectedItems[0]).getPath();
    		let row = oTable.getModel().getObject(sPath);
    		if(row.key.includes("LDAP_PASSWORD")){
    			this.byId("value").setType("Password");
    		}else{
    			this.byId("value").setType("Text");
    		}
    		this.byId("key").setValue(row.key);    		
    		this.byId("key").setEditable(false);
    		row.key.includes("_LAST_") ? this.byId("value").setValue(row.valueAux) : this.byId("value").setValue(row.value);
    		this.byId("value").setEditable(false);
    		this.byId("encoded").setSelected(row.encoded);
    		this.byId("encoded").setEditable(false);
    		//backup record
    		this.backupRecord = row;    
    		
        }else{//Clean controls
        	
        	//Empty backup record
        	this.backupRecord = {};
        	let bNew = this.byId("bNew");
			let bDelete = this.byId("bDelete");
        	
        	//Set the state for controls
        	if(selectedItems.length == 0){
    			bNew.setEnabled(true);
    			bDelete.setEnabled(false);
    		}else{
    			bNew.setEnabled(false);
    			bDelete.setEnabled(true);        			
    		}
        				
			let bEdit = this.byId("bEdit");		
    		bEdit.setEnabled(false);
    		let bCancel = this.byId("bCancel");
    		bCancel.setEnabled(false);
    		let bSave = this.byId("bSave");
    		bSave.setEnabled(false);
			
    		//Disable controls & set values    		    		
    		this.byId("key").setValue("");
    		this.byId("value").setValue("");
    		this.byId("encoded").setEditable(false);
    		this.byId("encoded").setSelected(false);      		
        }            		
	},

	tablaActualizacion: function(oEvent){
		let prueba = this.byId("oTable").getSelectedItems();	
		this.byId("bNew").setEnabled(true);
		this.byId("bEdit").setEnabled(true);
		this.byId("bCancel").setEnabled(false);
		this.byId("bSave").setEnabled(false);
		this.byId("bDelete").setEnabled(true);
	},



	enabledSave: function(oEvent){
		let enable = this.byId("oTable").getSelectedItems();
		let key = enable[0].getCells()[0].getText();
		let modelData = this.byId("oTable").getModel("oModel").getData().properties;
		for(let i in modelData){
			if(modelData[i].key === key){
				enable[0].getCells()[1].setValue(modelData[i].valueAux);
				break;
			}
		}
		this.byId("bNew").setEnabled(false);
		this.byId("bEdit").setEnabled(false);
		this.byId("bCancel").setEnabled(true);
		this.byId("bSave").setEnabled(true);
		this.byId("bDelete").setEnabled(true);
		
		enable[0].getCells()[1].setEnabled(true);
		enable[0].getCells()[2].setEnabled(true);
	}, 

	refreshTable:function(){
		this.loadOptionsP();
	},

	loadOptionsP: async function(){
        BusyIndicator.show(0);
        try{
		const request = {"tokenObject": null, "lsObject":""};
        const json = await this.execService(InveServices.GET_OPTIONS,request,"getLoadOptions",true);
		if(json ){
			let data = json.lsObject;
			for(let i in data){
            			data[i].type = "Text";
            			if(data[i].key.includes("_LAST_")){
            				data[i].valueAux = parseInt(data[i].value);
            				data[i].value = this.formatDate(new Date(parseInt(data[i].value)));
            			}else{
							data[i].valueAux = data[i].value;
						}
            			
            			// if(data[i].key.includes("LDAP_PASSWORD")){
            			// 	//data[i].type = "Password";
						// 	data[i].value = "";
							
            			// }
						
						data[i].createdDate = this.formatDate(new Date(data[i].createdDate));
						data[i].modifiedDate = this.formatDate(new Date(data[i].modifiedDate));
						
            		}
            		this.oModel.setProperty("/properties",data);
                    console.log(this.oModel);

		}
        
            		
        }
        catch(error){
        console.log(error);
        }
        BusyIndicator.hide();

        
        
    },



	editRecord: function(){
		
		this.byId("bNew").setEnabled(true);
		this.byId("bEdit").setEnabled(false);
		this.byId("bCancel").setEnabled(true);
		this.byId("bSave").setEnabled(true);
		this.byId("bDelete").setEnabled(false);
	},
	

	saveEdition: async function(){
                    
            let table = this.byId("oTable").getSelectedItems();
            let value = table[0].getCells()[0].getText();
			value = value.trim();

            if(value.length == 0){		
                return;
            }        
           		
            value = table[0].getCells()[1].getValue();
            value = value.trim();

            if(value.length == 0){
                
                MessageBox.error("Es necesario introducir el valor");
                
                return;
            }
            
            let repository = new Object();
            repository.key = table[0].getCells()[0].getText();
            repository.value = table[0].getCells()[1].getValue();
            repository.encoded = table[0].getCells()[2].getState();
            
            let request = new Object();
            request.tokenObject = null;
            request.lsObject = repository;	
			let json;		
			try{
            json = await this.execService(InveServices.SAVE_OPTIONS,request,"saveEdition",true);
            }catch(error){
				console.log(error)
			}
			if(json){
				this.byId("bNew").setEnabled(true);
				this.byId("bEdit").setEnabled(true);
				this.byId("bCancel").setEnabled(false);
				this.byId("bSave").setEnabled(false);
				this.byId("bDelete").setEnabled(true);
	
				this.loadOptionsP();
	
				table[0].getCells()[1].setEnabled(false);
				table[0].getCells()[2].setEnabled(false);
				this.byId("oTable").removeSelections(true);
	
				MessageBox.success("Se guardó el registro de forma exitosa.");
			}
			
			

            
        },

		cancelEdition: function(){
				let row = this.byId("oTable").getSelectedItems();
				MessageBox.confirm("¿Desea cancelar la edición?", {
				actions: ["Si", "No"],
				onClose: function (sAction) {
					if(sAction === "Si"){
						row[0].getCells()[1].setEnabled(false);
						row[0].getCells()[2].setEnabled(false);
						this.byId("oTable").removeSelections(true);
						this.loadOptionsP();
						this.byId("bNew").setEnabled(true);
						this.byId("bEdit").setEnabled(false);
						this.byId("bCancel").setEnabled(false);
						this.byId("bSave").setEnabled(false);
						this.byId("bDelete").setEnabled(false);
								}

				}.bind(this)
			});

		},

		saveNewRecord: async function(){
			this.byId("newKey").setValueState("None");

			let key = this.byId("newKey").getValue();
			key = key.trim();
			let value = this.byId("newValue").getValue();
			value = value.trim();
			let encoded = this.byId("newEncoded").getState();
			
			if(key.length == 0){
				this.byId("newKey").setValueState("Error");
				this.byId("newKey").setValueStateText("El campo no puede estar vacio");
				return;

			}
			else{
				let opciones = this.byId("oTable").getItems();
				console.log(opciones[0].getCells()[0].getText());
				console.log(opciones.length);		
                for(let i = 0; i < opciones.length; i++){
                    
                    if(key == opciones[i].getCells()[0].getText()){
                        
                        MessageBox.warning('"Key" ya registrada.');
                        
                        return;
                    }	            			
                }
			}
			if(value.length == 0){
				MessageBox.warning('Es necesario introducir el "Valor".');
				return;

			}

			
			let data = {
				key: key,	
				value: value,
				encoded: encoded
			};

			let request = new Object();
            request.tokenObject = null;
            request.lsObject = data;
			
			try{
            await this.execService(InveServices.SAVE_OPTIONS,request,"saveNewRecord",true);
            }catch(error){
				console.log(error);
			}
			this.byId("saveRecord").close()
			MessageBox.success("Se guardó el registro de forma exitosa.");

			this.byId("oTable").removeSelections(true);
			this.loadOptionsP();
			this.byId("bNew").setEnabled(true);
			this.byId("bEdit").setEnabled(false);
			this.byId("bCancel").setEnabled(false);
			this.byId("bSave").setEnabled(false);
			this.byId("bDelete").setEnabled(false);
		},

		cancelNewRecord: function(){
			this.byId("saveRecord").close();


		},

		deleteRecord: function(){
			MessageBox.confirm("¿Desea eliminar los registros seleccionados?", {
				actions: ["Si", "No"],
				onClose: async function (sAction) {
					if(sAction === "Si"){

						let opciones = this.byId("oTable").getSelectedItems();
						let arr = opciones[0].getCells()[0].getText()+",";

						let request = new Object();
						request.tokenObject = null;
						request.lsObject = arr;
						
						try{
						await this.execService(InveServices.DELETE_OPTIONS,request,"deleteRecord",true);
						}catch(error){
							console.log(error)
						}
						MessageBox.success("Se elimino el registro de forma exitosa");

						this.byId("oTable").removeSelections(true);
						this.loadOptionsP();
						this.byId("bNew").setEnabled(true);
						this.byId("bEdit").setEnabled(false);
						this.byId("bCancel").setEnabled(false);
						this.byId("bSave").setEnabled(false);
						this.byId("bDelete").setEnabled(false);
								}
						else{
						this.byId("oTable").removeSelections(true);
						this.loadOptionsP();
						this.byId("bNew").setEnabled(true);
						this.byId("bEdit").setEnabled(false);
						this.byId("bCancel").setEnabled(false);
						this.byId("bSave").setEnabled(false);
						this.byId("bDelete").setEnabled(false);
						}

				}.bind(this)
			});
		},

		newRecord: function(){
			let oView = this.getView();
                if (!this.byId("saveRecord")) {
                    Fragment.load({
					id: oView.getId(),
                        name: "com.bmore.inveweb.view.fragments.vMCRepository",
                        controller: this
                    }).then(function (oDialog) {
                        oView.addDependent(oDialog);
                        oDialog.open();
                    });

                } else {
                    this.byId("saveRecord").open();
					this.byId("newKey").setValueState("None");
					this.byId("newKey").setValue();
					this.byId("newValue").setValue();
					this.byId("newEncoded").setState();
                }
			


		},

		filterTable: function(){
		
		let fSearch = this.byId("fSearch");
		let value = fSearch.getValue();
		let oFilterKey = new Filter("key",  FilterOperator.Contains, value);
		let oFilterValue = new Filter("value",  FilterOperator.Contains, value);
        let allFilter = new Filter([oFilterKey, oFilterValue]);        
        let oTable = this.byId("oTable");
        oTable.getBinding("items").filter(allFilter, FilterType.Application);
	},


	});
    }
  );