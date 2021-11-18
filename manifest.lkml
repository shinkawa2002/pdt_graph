
project_name: "pdt_graph"

application: pdt_graph {
  label: "pdt_graph"
  url: "http://localhost:8080/bundle.js"
  # file: "bundle.js
  entitlements: {
    core_api_methods: ["all_lookml_models","run_inline_query","all_connections","graph_derived_tables_for_view"] #Add more entitlements here as you develop new functionality
  }
}
