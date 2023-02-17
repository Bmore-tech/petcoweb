sap.ui.define(
	[
	  "com/bmore/inveweb/controller/BaseController",
	  "sap/ui/core/BusyIndicator",
	  "sap/ui/model/json/JSONModel",
      "sap/ui/core/Fragment",
	  "sap/ui/core/Item",
	  "sap/ui/core/MessageType",
	  "sap/m/MessageBox",
	],
	function (Controller,BusyIndicator,JSONModel,Fragment,Item,MessageType,MessageBox) {
	  "use strict";
  
	  return Controller.extend("com.bmore.inveweb.controller.vMultiAlmacen", {
        onInit: function() {
            
            this.getView().addDelegate({

                onBeforeShow: function(evt) {      
    
                    BusyIndicator.hide();				
                    this.cleanView();
                    
			        this.ADMIN_ROLE = this.roleExists("INV_CIC_ADMIN");						
                    this.backupRecord = [];
    
                    this.setBukrsAndWerks();				
                }.bind(this)
            });
        },

        cleanView: function(){

            // Clean Edition
            this.byId('modifiedBy').setValue("");
            this.byId('modifiedDate').setValue("");

            //this.byId("bEdit").setEnabled(false);
            this.byId("bCancel").setEnabled(false);
            this.byId("bSave").setEnabled(false);
            this.byId("bAddPosition").setEnabled(false);
            this.byId("bDeletePosition").setEnabled(false);
    	
    
            // Empty table
            this.byId("oTable").setModel(new JSONModel([]),"oModel");	
        },

        setBukrsAndWerks: async function(){
            await this.loadSocieties(this.byId("bukrs"));
            if(!this.ADMIN_ROLE){
                this.byId("bEdit").setEnabled(true);
                let bukrs = this.getBukrs();
                this.byId("bukrs").setSelectedKey(bukrs);
                this.byId("bukrs").setEnabled(false);
    
                let cmbxWerks = this.byId("werks");
    
                if(cmbxWerks.getItems().length == 0){
    
                   await this.loadWerks();
                }
    
                let werks = this.getWerks();
                this.byId("werks").setSelectedKey(werks);
                this.byId("werks").setEnabled(false);
                this.loadWerksMultiAlmacen();
            }else{
                this.byId("bEdit").setEnabled(false);
                this.byId("bukrs").setSelectedKey(null);
                this.byId("bukrs").setEnabled(true);
                this.byId("werks").removeAllItems();
                this.byId("werks").destroyItems();
                this.byId("werks").setSelectedKey(null);
                this.byId("werks").setEnabled(true);
            }
        },

        eraseNotification : function() {
            this.byId("vbFrame").setVisible(false);		
        },	
    
        loadWerks: async function(){
    
            this.eraseNotification();
    
            let bukrsBean = {
                bukrs : this.byId('bukrs').getSelectedKey()
            }
    
            this.cleanView();

            const request = {
                tokenObject: null,
                lsObject:bukrsBean
            };

            const json = await this.execService(InveServices.GET_BUKRS_AND_WERKS,request,"loadWerks",this.showLog);

            if(json){
                let selectWerks = this.byId("werks");
                selectWerks.removeAllItems();
                selectWerks.destroyItems();
                selectWerks.setSelectedKey(null);
                
                let data = json.lsObject;	
                

                if(data.length!=0){

                    this.fillWerks(data,selectWerks);

                }else{

                    MessageBox.show('La "Sociedad" seleccionada no cuenta con centros asociados',
                            MessageBox.Icon.ERROR, "Error");

                }	
            }
        },

        loadLgort: async function(werksId){
                    
            let LgortBeanView = {
                werks : werksId
            }
    
            const request = {
                tokenObject: null,
                lsObject: LgortBeanView
            };

            const json = await this.execService(InveServices.GET_LGORT_AND_WERKS,request,"loadLgort",this.showLog);

            if(json){
                let data = json.lsObject;
                for(let i in data){
                    data[i].selected = false;
                }
                return data;
            }
        },
        
        loadWerksMultiAlmacen: async function(){
            BusyIndicator.show(0);
            let werksBean = {
                bukrs : this.byId('bukrs').getSelectedKey(),
                werks : this.byId('werks').getSelectedKey()
            }
      
            this.cleanView();
            
            const request = {
                tokenObject: null,
                lsObject:werksBean
            };

            const json = await this.execService(InveServices.GET_BUKRS_WERKS_MULTI_ALMACEN,request,"loadWerksMultiAlmacen",this.showLog);

            if(json){
                BusyIndicator.show(0);
                if (json.lsObject.length > 0) {
                    this.byId('modifiedBy').setValue(json.lsObject[0].modifiedBy);
                    this.byId('modifiedDate').setValue(this.formatDate(new Date(json.lsObject[0].modifiedDate)));
                }

                await this.prepareLgorts(json.lsObject);
                this.byId("bEdit").setEnabled(true);
                BusyIndicator.hide();
            }	
        },

         returnAction : function() {
            window.history.go(-1);
            
        },


        prepareLgorts: async function(data){

            let oTable = this.byId("oTable");
            let dataToTable= [];

            for(let i = 0; i < data.length; i++){
                let existe = false; 
                dataToTable = oTable.getModel("oModel").getData();
                for(let j in dataToTable){
                    if(dataToTable[j].bukrs == data[i].bukrs && 
                            dataToTable[j].werks == data[i].werks){
                        existe = true;
                        break;
                    }
                }
                if(existe){
                    continue;
                }else{
                    let entry = new Object();

                    entry.bukrs = data[i].bukrs;
                    entry.werks = data[i].werks;
                    entry.lgort = await this.loadLgort(data[i].werks.split(" - ")[0]); 
                    
                    dataToTable.unshift(entry);	
                
                    oTable.getModel("oModel").refresh(true);	
                    let modelTable = oTable.getModel("oModel").getData();
                    this.createItemsMultCmbx(this.byId("oTable").getItems()[0].getCells()[2],entry.lgort);

                    let lgortItems = this.byId("oTable").getItems()[0].getCells()[2].getItems();
                    let selectLgorts = data[i].listLgort;
                    let arrLgortSelected = [];
                    for(let i in lgortItems){
                        for(let j in selectLgorts){
                            if(lgortItems[i].getKey() == selectLgorts[j].split(" - ")[0]){
                                modelTable[0].lgort[i].selected = true;
                                arrLgortSelected.push(lgortItems[i]);
                            }
                        }
                        
                    }
                    if(arrLgortSelected.length > 0){
                        this.byId("oTable").getItems()[0].getCells()[2].setSelectedItems(arrLgortSelected);
                    }
                    this.byId("oTable").getItems()[0].getCells()[2].setEditable(false);
                    oTable.getModel("oModel").refresh(true);
                }
                            
                                                                                    
            }
        },

        createItemsMultCmbx: function(multCmbx,modelLgort){

            multCmbx.removeAllItems();
            multCmbx.destroyItems();

            for(let b in modelLgort){

                let item = new Item({
                    text : modelLgort[b].lgort+" - "+modelLgort[b].lgobe, // string
                    key : modelLgort[b].lgort, // string
                    tooltip : modelLgort[b].lgort+" - "+modelLgort[b].lgobe, // sap.ui.core.TooltipBase
                });
                multCmbx.addItem(item);	
            }

        },
    
        addPosition: function(){		
            let oView = this.getView();
            if (!this.byId("oDialogMultiAlmacen")) {
    
                Fragment.load({
                    id: oView.getId(),
                    name: "com.bmore.inveweb.view.fragments.vMCMultiAlmacen",
                    controller: this
                  }).then(function(oDialog){
                    oView.addDependent(oDialog);
                    this.cleanOdialog();
                    this.loadBukrsFragment();
                    oDialog.open();
                  }.bind(this));
            }else{
                this.cleanOdialog();
			    this.loadBukrsFragment();
                this.byId("oDialogMultiAlmacen").open();
            }
    	
        },
        _closeDialog:function(){
            this.byId("oDialogMultiAlmacen").close();
        },

        cleanOdialog: function(){
							
			Fragment.byId(this.getView().getId(), "bukrs_").removeAllItems();	
			Fragment.byId(this.getView().getId(), "bukrs_").destroyItems();	
			Fragment.byId(this.getView().getId(), "werks_").removeAllItems();
			Fragment.byId(this.getView().getId(), "werks_").destroyItems();
			
			Fragment.byId(this.getView().getId(), "bukrs_").setSelectedKey(null);		
			Fragment.byId(this.getView().getId(), "werks_").setSelectedKey(null);	
			
		
		},
        loadBukrsFragment: async function(){
			
			const request = {
				tokenObject: null,
				lsObject:""
			};
			const json = await this.execService(InveServices.GET_BUKRS,request,"loadBukrsFragment",this.showLog);

       		if(json){
				// Create a model and bind the table rows to this model
				let selectBukrs = Fragment.byId(this.getView().getId(), "bukrs_");
						
				selectBukrs.removeAllItems();
				selectBukrs.destroyItems();
				let data = json.lsObject;  		



				for(let i = 0; i < data.length; i++){

					let item = new Item({
						text : data[i].bukrs + " - " + data[i].bukrsDesc, // string
						key : data[i].bukrs, // string
						tooltip : data[i].bukrs, // TooltipBase
					});
					
					selectBukrs.addItem(item);	            			
				}
			BusyIndicator.hide();	
			return selectBukrs;
			   }
		}, 
        loadWerksFragment: async function(){
			
			let bukrsBean = new Object();
			bukrsBean.bukrs = Fragment.byId(this.getView().getId(), "bukrs_").getSelectedKey();
			bukrsBean.bukrsDesc = null;
			bukrsBean.werks = null;
			bukrsBean.werksDesc = null;
			
			let selectWerks = Fragment.byId(this.getView().getId(), "werks_");
			
			selectWerks.removeAllItems();
			selectWerks.destroyItems();
			Fragment.byId(this.getView().getId(), "werks_").setSelectedKey(null);

			const request = {
				tokenObject: null,
				lsObject:bukrsBean
			};

			const json = await this.execService(InveServices.GET_BUKRS_AND_WERKS,request,"loadWerksFragment",this.showLog);

       		if(json){
				let selectWerks = Fragment.byId(this.getView().getId(), "werks_");
						
				selectWerks.removeAllItems();
				selectWerks.destroyItems();
				let data = json.lsObject;	            		

				if(data.length!=0){

					for(let i = 0; i < data.length; i++){

						let item = new Item({
							text : data[i].werks + " - " + data[i].werksDesc, // string
							key : data[i].werks, // string
							tooltip : data[i].werks, // TooltipBase
						});
						selectWerks.addItem(item);	            			
					} 
					setTimeout(function() {
						selectWerks.focus();
					},100);	

				}else{
					MessageBox.show('La "Sociedad" seleccionada no cuenta con centros asociados',
							MessageBox.Icon.ERROR, "Error");
					}
				BusyIndicator.hide();
			}
		},
        setValues: async function(){
			
			let burks = Fragment.byId(this.getView().getId(), "bukrs_");
			let burksId = burks.getSelectedKey();
		
			
			if(burksId.length == 0){
				
				MessageBox.show('Es necesario elegir una sociedad.',
						MessageBox.Icon.ERROR, "Error");
				
				return;
			}
			
			let werks = Fragment.byId(this.getView().getId(), "werks_");
			let werksId = werks.getSelectedKey();
			
			if(werksId.length == 0){
				
				MessageBox.show('Es necesario elegir un centro.',
						MessageBox.Icon.ERROR, "Error");
				
				return;
			}

			let listLgort = await this.loadLgort(werksId);
			//console.log("lgorts de "+werksId,listLgort);
			
			let data;
			
			try {
				data = this.byId("oTable").getModel("oModel").getData();
			} catch (e) {
				data = [];
			}
			
			let headerBukrs =  this.byId("bukrs").getSelectedKey();
			let headerWerks =  this.byId("werks").getSelectedKey();
			
			for(let i = 0; i < data.length; i++){
				
				if(data[i].werks.split(" - ")[0] == werksId 
						&& data[i].bukrs.split(" - ")[0] == burksId){
					
					MessageBox.show('La combinación ya se encuentra definida.',
							MessageBox.Icon.ERROR, "Error");	    		
					return;
				}
			}

			if(burksId == headerBukrs && werksId == headerWerks){
				MessageBox.show('No se puede seleccionar la misma sociedad y centro de la cabecera.',
						MessageBox.Icon.ERROR, "Error");	    		
				return;
			}
				
			let entry = new Object();
			

			entry.bukrs = burks.getSelectedItem().getText();
			
			
			entry.werks = werks.getSelectedItem().getText();
			
			entry.lgort = listLgort;
			
			data.push(entry);
					
			
			let oTable = this.byId("oTable");
			oTable.getModel("oModel").refresh(true);
			let tableItems = oTable.getItems();
			let modelData = oTable.getModel("oModel").getData();
			for(let i in tableItems){
				let bukrs = tableItems[i].getCells()[0].getText().split(" - ")[0];
				let werks = tableItems[i].getCells()[1].getText().split(" - ")[0];
				if(bukrs == entry.bukrs.split(" - ")[0] && werks == entry.werks.split(" - ")[0]){
					this.createItemsMultCmbx(tableItems[i].getCells()[2],modelData[i].lgort);
					break;
				}
				
			}    	
			
			this._closeDialog();
			
		},
    
        removePosition: function(){

            let oTable = this.byId('oTable');  		
            let selectedItems = oTable.getSelectedItems();
            
            if(selectedItems.length > 0){
                
                // Clean messages
                this.getView().byId("messagesBox").removeAllItems();
                
                // Delete data
                let selectedItems = oTable.getSelectedItems();

                let posicionesDeseadas = [];
                let modelData = oTable.getModel("oModel").getData();

                for(let i in oTable.getItems()){
                    
                    if(selectedItems.indexOf(oTable.getItems()[i]) == -1 ){
                        posicionesDeseadas.push(modelData[i]);
                    }			    			        			
                }	    			        			
                	
                oTable.setModel(new JSONModel(posicionesDeseadas),"oModel");
                let tableItems = oTable.getItems();
                let modelTable = oTable.getModel("oModel").getData();
                for(let j in tableItems){
                    let lgortsModel = modelTable[j].lgort;
                    this.createItemsMultCmbx(tableItems[j].getCells()[2],lgortsModel);
                    let lgortItems = tableItems[j].getCells()[2].getItems();
                    let selectedLgorts = [];
                    for(let k in lgortItems){
                        if(lgortsModel[k].selected == true){
                            selectedLgorts.push(lgortItems[k]);
                        }
                    }
                    tableItems[j].getCells()[2].setSelectedItems(selectedLgorts);
                }
                
            }else{
                
                this.toast("Nada que eliminar", "20em");
            }
    //////////////////////////////////////////////////////////////////////////
        }, 	
    
    
        editRecord: function(){
    
            
            let data;
    
            try {
                data = this.byId("oTable").getModel("oModel").getData();
            } catch (e) {
                data = [];
            }	
    
            this.byId("bEdit").setEnabled(false);
            this.byId("bCancel").setEnabled(true);
            this.byId("bSave").setEnabled(true);
            this.byId("bAddPosition").setEnabled(true);
            this.byId("bDeletePosition").setEnabled(true);
    
            this.setOnEdit(true);
            this.backupRecord = this.copyObjToNew(data);
    
            for(let i = 0; i < data.length; i++){
    
                data[i].editable = true;
            }
    
            this.byId("oTable").getModel("oModel").refresh(true);
            
            
        },
    
        cancelEdition: function(){
    
            this.eraseNotification();
    
            // Show confirm dialog
            MessageBox.confirm(
                    "¿Desea cancelar la edición?", {
                        icon: MessageBox.Icon.QUESTION,
                        actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                        onClose: function(oAction) { 
    
                            if(oAction == 'YES'){
    
                                this.setOnEdit(false);
    
                                this.byId("bEdit").setEnabled(true);
                                this.byId("bCancel").setEnabled(false);
                                this.byId("bSave").setEnabled(false);
                                this.byId("bAddPosition").setEnabled(false);
                                this.byId("bDeletePosition").setEnabled(false);
                                
                                let oTable = this.byId("oTable");
                                oTable.setModel(new JSONModel(this.backupRecord),"oModel");
                                let tableItems = oTable.getItems();
                                let modelTable = oTable.getModel("oModel").getData();
                                for(let j in tableItems){
                                    let lgortsModel = modelTable[j].lgort;
                                    this.createItemsMultCmbx(tableItems[j].getCells()[2],lgortsModel);
                                    let lgortItems = tableItems[j].getCells()[2].getItems();
                                    let selectedLgorts = [];
                                    for(let k in lgortItems){
                                        if(lgortsModel[k].selected == true){
                                            selectedLgorts.push(lgortItems[k]);
                                        }
                                    }
                                    tableItems[j].getCells()[2].setSelectedItems(selectedLgorts);
                                }
                            }  			        	  			        	  
                        }.bind(this)						
                    }
            );
        },
    
        saveEdition: async function(){
            BusyIndicator.show(0);

            let entry = {
                bukrs : this.byId('bukrs').getSelectedKey(),
                werks : this.byId('werks').getSelectedKey()
            }

            let isUrban = await this.isUrban();
            if(isUrban){
            	MessageBox.show('La sociedad '+entry.bukrs+' y centro '+entry.werks+' del usuario, ya está configurada como Urban\nFavor de desactivar Urban para usar Multi-Almacenes',
                        MessageBox.Icon.ERROR, "Conflicto");
                BusyIndicator.hide();
            	return;
            }

             let itemsTable = this.byId("oTable").getItems();
             let listToBack = [];
             for(let i in itemsTable){
                let objToBack = new Object();
                objToBack.bukrs = itemsTable[i].getCells()[0].getText().split(" - ")[0]//bukrsId
                objToBack.werks =itemsTable[i].getCells()[1].getText().split(" - ")[0]//werksId
                let itemsLgort = itemsTable[i].getCells()[2].getSelectedItems();
                if(itemsLgort == undefined || itemsLgort.length == 0){
                    MessageBox.show('Debe seleccionar por lo menos un almacén para la posición '+ (parseInt(i) + 1),
                        MessageBox.Icon.ERROR, "Datos incompletos");
                BusyIndicator.hide();
            	return;
                }
                objToBack.listLgort = [];
                for(let j in itemsLgort){
                    objToBack.listLgort.push(itemsLgort[j].getKey());
                }

                listToBack.push(objToBack);
             }
                
            listToBack.unshift(entry);

            const request = {
                tokenObject: null,
                lsObject:listToBack
            };
            
            const json = await this.execService(InveServices.SAVE_BUKRS_AND_WERKS_MULTI_ALMACEN,request,"saveEdition",this.showLog);

            if(json){
                BusyIndicator.show(0);
                this.byId("bEdit").setEnabled(true);
                this.byId("bCancel").setEnabled(false);
                this.byId("bSave").setEnabled(false);
                this.byId("bAddPosition").setEnabled(false);
                this.byId("bDeletePosition").setEnabled(false);

                let modeldata =this.byId("oTable").getModel("oModel").getData();
                for(let i in modeldata){

                    modeldata[i].editable = false;
                }
        
                this.byId("oTable").getModel("oModel").refresh(true);

                let message = 'El registro se guardó de forma exitosa.'; 
                this.message(message, MessageType.Success,this.byId("messagesBox"),this.byId("vbFrame"),this.byId("pMultiAlm"));

                setTimeout(function() {
                    this.byId("messagesBox").getItems()[0].close();      
                }.bind(this),3000);
                this.setOnEdit(false);
                BusyIndicator.hide();
                this.byId("werks").fireChange();
            }
    
        },

        isUrban: async function(){
        	let werksBean = {
                    bukrs : this.byId('bukrs').getSelectedKey(),
                    werks : this.byId('werks').getSelectedKey()
                }
        	
            const request = {
                tokenObject: null,
                lsObject:werksBean
            };

            const json = await this.execService(InveServices.IS_URBAN,request,"isUrban",this.showLog);

            if(json){
                return json.abstractResult.booleanResult;		
            }	
        },
      });
    }
  );