import re

with open('seed_kengo_kuma_areas.sql', 'r', encoding='utf-8') as f:
    content = f.read()

# We only care about the part after "-- 2. CREACIÓN DE SUBNIVELES"
parts = content.split('-- 2. CREACIÓN DE SUBNIVELES (Espacios) Y SUS ÁREAS (Modelo Constructiva)')
if len(parts) < 2:
    print("Could not find part 2")
    exit(1)

head = parts[0] + '-- 2. CREACIÓN DE SUBNIVELES (Espacios) Y SUS ÁREAS (Modelo Constructiva)'
tail = parts[1]

# In tail, we need to replace all INSERT INTO public.project_area_details (...) VALUES (...)
# We'll use a regex to find these statements.
insert_pattern = r"INSERT INTO public\.project_area_details \(([^)]+)\) VALUES \(([^)]+)\);"

def replace_insert(match):
    cols_str = match.group(1)
    vals_str = match.group(2)
    
    cols = [c.strip() for c in cols_str.split(',')]
    # vals might contain strings with commas, but in our seed file they are simple strings like 'Black box theatre'
    # We can split by comma if we are careful, but let's use regex to split correctly or just simple split since there are no commas in the usage_type strings.
    # Wait, 'Black box theatre' doesn't have commas. Are there any commas?
    # Let's check if there are commas in values. Usually we have strings like 'Speak Easy / Tea room'. No commas.
    # Just in case, let's split by comma carefully.
    
    # A simple trick: split by comma but ignore commas inside quotes.
    vals = re.split(r",(?=(?:[^']*'[^']*')*[^']*$)", vals_str)
    vals = [v.strip() for v in vals]
    
    # Base columns
    project_id = vals[cols.index('project_id')]
    level_id = vals[cols.index('level_id')]
    context_type = vals[cols.index('context_type')]
    usage_type = vals[cols.index('usage_type')] if 'usage_type' in cols else 'NULL'
    
    # Mapping
    mapping = {
        'built_within_plot': ('WITHIN NEW PLOT', 'built_area'),
        'uncovered_within_plot': ('WITHIN NEW PLOT', 'uncovered_area'),
        'built_extension_new': ('EXTENSION EXISTING PLOT', 'built_area'),
        'uncovered_extension_new': ('EXTENSION EXISTING PLOT', 'uncovered_area'),
        'built_extension_refurb': ('EXTENSION EXISTING PLOT - REFURBISHMENT', 'built_area'),
        'uncovered_extension_refurb': ('EXTENSION EXISTING PLOT - REFURBISHMENT', 'uncovered_area'),
    }
    
    # Group by lote_name
    lotes = {}
    for i, col in enumerate(cols):
        if col in mapping:
            lote_name, area_type = mapping[col]
            if lote_name not in lotes:
                lotes[lote_name] = {'built_area': 0, 'uncovered_area': 0}
            lotes[lote_name][area_type] = vals[i]
            
    # Generate new inserts
    new_inserts = []
    for lname, areas in lotes.items():
        new_inserts.append(
            f"INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES ({project_id}, {level_id}, {context_type}, {usage_type}, '{lname}', {areas['built_area']}, {areas['uncovered_area']});"
        )
        
    return "\n    ".join(new_inserts)

new_tail = re.sub(insert_pattern, replace_insert, tail)

new_content = head + new_tail

with open('seed_kengo_kuma_areas.sql', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Replacement complete.")
