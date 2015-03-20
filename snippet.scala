
object REPLACE_ModuleName extends SmvModule("REPLACE_ModuleDescription") {

  override def version() = 0;
  override def requiresDS() = Seq(REPLACE_required_Modules);
 
  override def run(i: runParams) = {
    val srdd = i(REPLACE_one_of_the_required_Modules)
    import srdd.sqlContext._
  }
}
