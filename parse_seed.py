import re

with open('seed_kengo_kuma_areas.sql', 'r', encoding='utf-8') as f:
    content = f.read()

# We want to transform the inserts into project_levels to remove areas_generales,
# and instead append inserts into project_area_details at the end of the main levels creation.

# It's easier to just recreate the file manually or write a script that regexes it.
# The inserts look like: (v_b4_id, v_project_id, 'BASEMENT 4', -4, null, 'TOTAL COVERED: 116 m²\n- Built Gross (Within Plot): 116 m²'),

pattern = r"\((v_\w+_id), v_project_id, '([^']+)', ([^,]+), null, 'TOTAL COVERED:[^\n]*\n([^']+)'\)"
matches = re.finditer(pattern, content)

levels = []
for m in matches:
    level_var = m.group(1)
    level_name = m.group(2)
    level_index = m.group(3)
    areas_str = m.group(4)
    
    # parse areas_str
    # - Built Gross (Within Plot): 426 m²
    # - New Build Gross (Extension): 124 m²
    # - Uncovered (Within Plot): 152 m²
    
    sub_lotes = {}
    
    for line in areas_str.split('\n'):
        if not line.strip(): continue
        # map line to sub_lotes
        if 'Within Plot' in line:
            lote_name = 'WITHIN NEW PLOT'
        elif 'Extension' in line and 'Refurbishment' not in line:
            lote_name = 'EXTENSION EXISTING PLOT'
        elif 'Refurbishment' in line:
            lote_name = 'EXTENSION EXISTING PLOT - REFURBISHMENT'
        else:
            lote_name = 'OTHER'
            
        is_uncovered = 'Uncovered' in line
        
        # extract number
        num_match = re.search(r': ([\d\.]+) m²', line)
        if num_match:
            num = float(num_match.group(1))
            if lote_name not in sub_lotes:
                sub_lotes[lote_name] = {'built': 0, 'uncovered': 0}
            
            if is_uncovered:
                sub_lotes[lote_name]['uncovered'] += num
            else:
                sub_lotes[lote_name]['built'] += num

    levels.append({
        'var': level_var,
        'name': level_name,
        'idx': level_index,
        'lotes': sub_lotes
    })

# Now let's generate the new SQL for these levels
sql_levels = "    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES\n"
sql_levels_vals = []
for l in levels:
    sql_levels_vals.append(f"    ({l['var']}, v_project_id, '{l['name']}', {l['idx']}, null)")
sql_levels += ",\n".join(sql_levels_vals) + ";\n\n"

sql_details = "    INSERT INTO public.project_area_details (project_id, level_id, context_type, name, built_area, uncovered_area) VALUES\n"
sql_details_vals = []
for l in levels:
    for lname, areas in l['lotes'].items():
        sql_details_vals.append(f"    (v_project_id, {l['var']}, 'GENERAL', '{lname}', {areas['built']}, {areas['uncovered']})")
sql_details += ",\n".join(sql_details_vals) + ";\n"

print("--- LEVELS ---")
print(sql_levels)
print("--- DETAILS ---")
print(sql_details)
