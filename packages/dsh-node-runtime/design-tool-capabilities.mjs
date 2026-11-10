// Access classifications for the managed document host; unknown tools require dedicated authorization.

const READ = new Set([
  'tool_search', 'batch_get', 'read_nodes', 'get_design_code_context',
  'get_accessibility_tree', 'snapshot_layout', 'find_empty_space', 'find_node_by_name',
  'count_nodes', 'list_node_kinds', 'get_editor_state', 'get_document_info',
  'get_selection', 'get_selection_set', 'get_node', 'get_node_children',
  'get_node_parent', 'get_history_depth', 'get_canvas_bounds', 'get_viewport',
  'list_pages', 'list_variables', 'get_variables', 'get_active_theme',
  'list_components', 'get_component', 'list_ui_kits', 'get_guidelines',
  'get_style_guide_tags', 'get_style_guide', 'list_style_guides', 'get_design_md',
  'export_design_md', 'export_code', 'lint_document', 'search_all_unique_properties',
  'conversion_status', 'get_component_behaviour', 'get_component_properties', 'list_styles',
  'export_design_tokens', 'get_variable_mode', 'evaluate_variable', 'list_variants',
  'list_slots', 'get_text_style', 'list_theme_presets', 'get_theme_preset',
  'export_theme_preset', 'list_libraries', 'list_library_variables', 'get_library_updates',
  'get_prototype', 'simulate_prototype', 'get_screenshot', 'get_design_quality',
  'sample_color', 'get_design_prompt', 'get_design_agent_prompt', 'get_editor_theme',
  'get_ui_scale', 'get_figma_import_status', 'list_figma_import_jobs', 'plan_design_style',
  'plan_design_canvas', 'get_design_capabilities',
]);

const WRITE = new Set([
  'batch_design', 'set_node_semantics', 'set_design_md', 'fix_lint_issues',
  'replace_all_matching_properties', 'design_skeleton', 'design_content', 'design_refine',
  'upsert_variables', 'upsert_component', 'upsert_screen', 'align_selected',
  'arrange_nodes', 'paste_properties', 'set_vector_path', 'undo',
  'redo', 'duplicate_selected', 'delete_selected', 'nudge_selected',
  'group_selected', 'ungroup_selected', 'reorder_selected', 'cut_selected',
  'paste_clipboard', 'insert_node', 'update_node', 'replace_node',
  'delete_node', 'move_node', 'copy_node', 'paste_html',
  'import_mermaid', 'import_drawio', 'create_connector', 'set_component_behaviour',
  'create_style', 'update_style', 'apply_style', 'detach_style',
  'delete_style', 'import_design_tokens', 'bind_variable', 'unbind_variable',
  'set_variable_mode', 'create_variant', 'set_instance_variant', 'add_component_property',
  'update_component_property', 'delete_component_property', 'set_instance_properties', 'reset_instance_properties',
  'swap_instance', 'create_slot', 'update_slot', 'delete_slot',
  'fill_slot', 'set_node_collapsed', 'set_node_rotation', 'set_node_text',
  'set_node_corner_radius', 'set_node_font_size', 'set_node_font_weight', 'set_node_stroke_hex',
  'set_node_stroke_width', 'set_node_stroke_side_width', 'set_node_fill_hex', 'set_node_flip',
  'set_ellipse_arc', 'add_node_effect', 'remove_node_effect', 'set_node_name',
  'set_node_hidden', 'set_node_locked', 'set_variables', 'set_themes',
  'apply_design_system', 'create_variable', 'delete_variable', 'rename_variable',
  'set_variable_color', 'set_variable_number', 'set_variable_string', 'set_variable_boolean',
  'create_component', 'instantiate_component', 'delete_component', 'rename_component',
  'delete_page', 'set_active_page', 'add_page', 'rename_page',
  'remove_page', 'duplicate_page', 'reorder_page', 'finalize_design',
  'set_text_content', 'set_text_markdown', 'set_text_style', 'set_paragraph_style',
  'load_theme_preset', 'import_library_variables', 'accept_library_updates', 'set_prototype',
  'set_reactions', 'set_scroll_behavior', 'set_viewport',
]);

const SESSION = new Set([
  'set_active_axis_value', 'cycle_active_axis_value', 'set_selection', 'set_selection_set',
  'clear_selection', 'toggle_node_selection', 'copy_selected', 'copy_properties',
  'set_active_tool', 'set_ui_scale',
]);

export function designToolAccess(name) {
  if (READ.has(name)) return 'document-read';
  if (WRITE.has(name)) return 'document-write';
  if (SESSION.has(name)) return 'session';
  return 'sensitive';
}

export function designCapabilities(schemas) {
  return {
    version: 1,
    tools: schemas.map((schema) => ({ ...schema, access: designToolAccess(schema.name) })),
  };
}
