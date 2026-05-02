import os

def sync_file(csv_name, js_name, var_name):
    csv_path = csv_name
    js_path = js_name
    if os.path.exists(csv_path):
        with open(csv_path, 'r', encoding='utf-8') as f:
            text = f.read()
        escaped_text = text.replace('`', '\\`')
        js_content = f"const {var_name} = `{escaped_text}`;"
        with open(js_path, 'w', encoding='utf-8') as f:
            f.write(js_content)
        print(f"Updated {js_name}")
    else:
        print(f"Missing file: {csv_name}")

try:
    print("Syncing data...")
    sync_file('data.csv', 'data.js', 'csvData')
    sync_file('ai-comment.txt', 'ai-comment.js', 'aiCommentData')
    sync_file('stock_industry_classification.csv', 'industry_data.js', 'industryData')
    print("Done! Refresh your browser.")
except Exception as e:
    print(f"Error: {e}")
