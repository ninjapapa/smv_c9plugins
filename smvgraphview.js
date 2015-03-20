define(function(require, exports, module) {
    main.consumes = ["Editor", "editors", "ui"];
    main.provides = ["smvgraphview"];
    return main;

    function main(options, imports, register) {
        var Editor = imports.Editor;
        var editors = imports.editors;
        var ui = imports.ui;
        
        /***** Initialization *****/
        
        var extensions = [];

        var smvGraph = require("https://googledrive.com/host/0B14ee_4szaSncm5ZZ2xpZzUwRFU/smvGraph.js");
        //var smvGraph = require("./lib/smvGraph.js");
        
        function SmvGraphView(){
            var plugin = new Editor("Ajax.org", main.consumes, extensions);
            var container;
            
            var counter = 0;
            var sessionId = 0;
            
            plugin.on("draw", function(e) {
                container = e.htmlNode;
            });
            
            plugin.on("load", function(){
            });
            
            var currentDocument;
            plugin.on("documentLoad", function(e) {
                var doc = e.doc;
                var session = doc.getSession();
                var graphType = doc.meta.graphType;
                
                session.state = e.state || {};
                
                if (!session.div) {
                    session.id = sessionId++;
            
                    var div = document.createElement("div");
                    div.style.position = "absolute";
                    div.style.left = 0;
                    div.style.top = 0;
                    div.style.right = 0;
                    div.style.bottom = 0;
                    div.setAttribute("id", "d3inner" + session.id);
                    container.appendChild(div);
                    session.div = div;
 
                    session.smvGraph = smvGraph()
                      .init(session.div, graphType, {});
                }
                
                function renderDoc(value){
                    session.smvGraph.render(value);
                }
                
                // Value
                doc.on("getValue", function get(e) { 
                    return currentDocument == doc 
                        ? session.value
                        : e.value;
                }, session);
                
                doc.on("setValue", function set(e) { 
                    if (currentDocument == doc){ 
                        session.value = e.value;
                        renderDoc(session.value);
                    }
                }, session);
                
                session.state.backgroundColor = "#FFFFFF";
                session.state.dark = false;
 
                session.div.style.backgroundColor = 
                doc.tab.backgroundColor =
                    session.state.backgroundColor || "#FFFFFF";
                
                if (session.state.dark === false)
                    doc.tab.classList.remove("dark");
                else
                    doc.tab.classList.add("dark");
            });
            plugin.on("resize", function(e) {
                if(currentDocument && currentDocument.getSession().div){
                    if (container.firstChild)
                        container.removeChild(container.firstChild); 
                    container.appendChild(currentDocument.getSession().div);
                    if(currentDocument.getSession().smvGraph)
                      currentDocument.getSession().smvGraph.redraw();
                }
            })
            plugin.on("documentActivate", function(e) {
                if (currentDocument && currentDocument.getSession().div)
                    currentDocument.getSession().div.style.display = "none";
                    
                if (container.firstChild)
                    container.removeChild(container.firstChild); 
                container.appendChild(e.doc.getSession().div);
                
                currentDocument = e.doc;
                var session = e.doc.getSession();
                session.div.style.display = "block";
            });
            plugin.on("documentUnload", function(e) {
                // Do nothing when switching to an editor of the same type
                if (e.toEditor && e.toEditor.type == e.fromEditor.type)
                    return; 

                var session = e.doc.getSession();
                if(session.div && session.div.parentNode){
                    session.div.parentNode.removeChild(session.div);
                    delete(session.div);
                }
            });
            plugin.on("getState", function(e) {
                var doc = e.doc;
                e.state.backgroundColor = doc.tab.backgroundColor;
                e.state.dark = doc.tab.classList.names.indexOf("dark") > -1;
            });
            plugin.on("setState", function(e) {
                e.doc.tab.backgroundColor = e.state.backgroundColor || "#FFFFFF";
                if (e.state.dark)
                    e.doc.tab.classList.add("dark");
            });
            plugin.on("clear", function(){
            });
            plugin.on("focus", function(){
            });
            plugin.on("enable", function(){
            });
            plugin.on("disable", function(){
            });
            plugin.on("unload", function(){
            });
            
            /***** Register and define API *****/
            
            /**
             * The urlview handle, responsible for events that involve all 
             * UrlView instances. This is the object you get when you request 
             * the urlview service in your plugin.
             * 
             * Example:
             * 
             *     define(function(require, exports, module) {
             *         main.consumes = ["urlview"];
             *         main.provides = ["myplugin"];
             *         return main;
             *     
             *         function main(options, imports, register) {
             *             var urlviewHandle = imports.urlview;
             *         });
             *     });
             * 
             * 
             * @class urlview
             * @extends Plugin
             * @singleton
             */
            /**
             * Simple URL Viewer for Cloud9. This is not an actual editor
             * but instead loads an iframe in an editor tab. This editor can
             * only be instantiated programmatically and should be used when 
             * you need to show a website in Cloud9. 
             * 
             * Note that this plugin is not intended for previewing content,
             * use the {@link Preview} plugin for that purpose.
             * 
             * This example shows how to create a tab that shows c9.io.
             * 
             *     tabManager.open({
             *         value      : "http://www.c9.io",
             *         editorType : "urlview",
             *         active     : true,
             *         document   : {
             *             urlview : {
             *                 backgroundColor : "#FF0000",
             *                 dark            : true
             *             }
             *         }
             *     }, function(err, tab) {
             *          console.log("Done");
             *     })
             * 
             * @class urlview.UrlView
             * @extends Editor
             **/
            /**
             * The type of editor. Use this to create the urlview using
             * {@link tabManager#openEditor} or {@link editors#createEditor}.
             * @property {"urlview"} type
             * @readonly
             */
            /**
             * Retrieves the state of a document in relation to this editor
             * @param {Document} doc  The document for which to return the state
             * @method getState
             * @return {Object}
             * @return {String} return.backgroundColor  The background color of the tab.
             * @return {String} return.dark             Whether the "dark" class is set to the tab.
             */
            plugin.freezePublicAPI({
                
            });
            
            plugin.load("smvgraphview" + counter++);
            
            return plugin;
        }
        SmvGraphView.autoload = true;
        
        register(null, {
            smvgraphview: editors.register("smvgraphview", "Smv Graph Viewer", 
                                         SmvGraphView, extensions)
        });
    }
});
