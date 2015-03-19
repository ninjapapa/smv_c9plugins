define(function(require, exports, module) {
    main.consumes = [
        "Plugin", "ui", "commands", "menus", "tabManager", "tree", "util", "find", "watcher"
    ];
    main.provides = ["smvcommand"];
    return main;

    function main(options, imports, register) {
        var Plugin = imports.Plugin;
        var ui = imports.ui;
        var menus = imports.menus;
        var commands = imports.commands;
        var tabs = imports.tabManager;
        var tree = imports.tree;
        var util = imports.util;
        var find = imports.find;
        var watcher = imports.watcher;

        
        var snippet = require("text!./snippet.scala");
        var editor = {};
        
        /***** Initialization *****/
        var plugin = new Plugin("Smv Module Code Snip", main.consumes);
        
        /***** Methods *****/
        function initAce() {
            if (tabs.focussedTab.editorType != "ace") return;
            editor = tabs.focussedTab.document.editor.ace;
        }
        
        function gen_code() {
            var cursor = editor.selection.getCursor();
            editor.insert(snippet);
            editor.selection.moveCursorToPosition(cursor);
        }
        
        function findReplaces() {
            editor.find('REPLACE_[a-zA-Z_]*',{
                backwards: false,
                wrap: false,
                caseSensitive: false,
                wholeWord: false,
                regExp: true
            });
            editor.findNext();
            console.log(JSON.stringify(editor.getLastSearchOptions()));
        }
        
        function showDocInEditor(path, graphType) {
          tabs.open({
              path: path,
              editorType: "smvgraphview",
              forceNew: true,
              focus: true,
              document: {
                  meta: {
                    graphType: graphType  
                  }
                }
              },function(err, tab) {
                  watcher.watch(path);
                  watcher.on("change", function(e){
                    if(e.path == path){
                        tabs.reload(tab, function(){})
                    }
                  }, plugin);
              });
        }
        
        function showCurrentDocInEditor(editorType) {
          var currentTab = tabs.focussedTab;
          var path = currentTab.path
          currentTab.cleanUp();
          currentTab.close();
          showDocInEditor(path, editorType);
        }
        
        function saveSvgAsPng() {
            var session = tabs.focussedTab.document.getSession();
            if(!session.smvGraph) return;
            session.smvGraph.saveSvgAsPng();
        }
        
        function selectedNodeExt() {
            var node = tree.selectedNode;
            if (!node || node.isFolder) return "";
            var path = util.normalizePath(node.path);
            var ext = path.substr(path.lastIndexOf('.') + 1);
            console.log(path);
            return ext;
        }
        
        function showSelectedFileInEditor(editorType) {
            var node = tree.selectedNode;
            if (!node || node.isFolder) return;
            var path = util.normalizePath(node.path);
            showDocInEditor(path, editorType);
        }
 
        function findModule(ModuleName) {
          find.findFiles({
              path    : "/",
              query   : "object +".concat(ModuleName),
              regexp  : true,
              hidden  : false,
              pattern : "*.scala",
              buffer  : true
            }, function(err, result) {
              if (err) throw err;
              var fileName = result.split("\n")[0].replace(":","");
              var lineNum = result.split("\n")[1].split(":")[0];
              var opened = false;
              tabs.getTabs().forEach(function(tab) {
                if (fileName == tab.path) {
                  tab.activate();
                  tab.editor.ace.gotoLine(lineNum,0);
                  opened = true;
                }
              });
              if (!opened){
                tabs.open({
                  path: fileName,
                  editorType: "ace",
                  forceNew: true,
                  focus: true,
                  active: true
                },function(err, tab) {
                  tab.editor.ace.gotoLine(lineNum,0);
                });
              };
          });
        } 

        function load() {
            commands.addCommand({
                name: "smvAddModuleSnippet",
                group: "smv",
                bindKey: { mac: "Command-M", win: "Ctrl-M" },
                hint: "Add Smv Module Code Template",
                isAvailable: function(){ return true; },
                exec: function() {
                    initAce();
                    gen_code();
                    findReplaces();
                }
            }, plugin);
            
            commands.addCommand({
                name: "smvAddModuleSnippet_next",
                group: "smv",
                bindKey: { mac: "Shift-Command-M", win: "Shift-Ctrl-M" },
                hint: "Find next place in Smv Module template which need to change",
                isAvailable: function(){ return true; },
                exec: function() {
                    findReplaces();
                }
            }, plugin);
            
             
            commands.addCommand({
                name: "smvShowOnMap",
                group: "smv",
                isAvailable: function(){ return true; },
                exec: function() {
                    showCurrentDocInEditor("map");
                }
            }, plugin);
            
            commands.addCommand({
                name: "smvShowMa",
                group: "smv",
                isAvailable: function(){ return true; },
                exec: function() {
                    showCurrentDocInEditor("module");
                }
            }, plugin);
             
            commands.addCommand({
                name: "smvOpenOnMap",
                group: "smv",
                isAvailable: function(){ return true; },
                exec: function() {
                    showSelectedFileInEditor("map");
                }
            }, plugin);
 
            commands.addCommand({
                name: "smvOpenMa",
                group: "smv",
                isAvailable: function(){ return true; },
                exec: function() {
                    showSelectedFileInEditor("module");
                }
            }, plugin);
             
            commands.addCommand({
                name: "smvSavePng",
                group: "smv",
                isAvailable: function(){ return true; },
                exec: function() {
                    saveSvgAsPng();
                }
            }, plugin);
            
           
            commands.addCommand({
                name: "smvFindModule",
                group: "smv",
                isAvailable: function(){ return true; },
                bindKey: { mac: "Command-O", win: "Ctrl-O" },
                hint: "Find Smv Module definition",
                exec: function() {
                    initAce();
                    var position = editor.getCursorPosition();
                    var token = editor.session.getTokenAt(position.row, position.column);
                    //console.log(JSON.stringify(token));
                    findModule(token.value);
                }
            }, plugin);
            
            menus.setRootMenu("SMV", 700, plugin);

            menus.addItemByPath("SMV/Add Module Snippet", new ui.item({
                command: "smvAddModuleSnippet"
            }), 300, plugin);
            menus.addItemByPath("SMV/Show On Map", new ui.item({
                command: "smvShowOnMap"
            }), 310, plugin);
            menus.addItemByPath("SMV/Show MA", new ui.item({
                command: "smvShowMa"
            }), 320, plugin);
            menus.addItemByPath("SMV/Save Plot As PNG", new ui.item({
                command: "smvSavePng"
            }), 330, plugin);


            tree.getElement("mnuCtxTree", function(mnuCtxTree) {

                ui.insertByIndex(mnuCtxTree, new ui.divider(), 10000, plugin);

                plugin.smvMnuShowMa = new ui.item({
                    match: "file",
                    caption: "Open as Smv Module Graph",
                    command: "smvOpenMa"
                })
                ui.insertByIndex(mnuCtxTree, plugin.smvMnuShowMa, 10100, plugin);

                plugin.smvMnuOnMap = new ui.item({
                    match: "file",
                    caption: "Open on US Map",
                    command: "smvOpenOnMap"
                })
                ui.insertByIndex(mnuCtxTree, plugin.smvMnuOnMap, 10200, plugin);


                mnuCtxTree.on("display", function(){
                    var ext = selectedNodeExt();
                    plugin.smvMnuShowMa.setAttribute("disabled", (ext != "json"));
                    plugin.smvMnuOnMap.setAttribute("disabled", (ext != "csv"));
                },plugin);

            });

        }
          
        /***** Lifecycle *****/
        
        plugin.on("load", function() {
            load();
        });

        plugin.on("unload", function() {
            editor.delete;
        });
        
        /***** Register and define API *****/
        
        register(null, {
            "smvcommand": plugin
        });
    }
});
