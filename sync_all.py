import os
import csv
import json

def sync_ai_comment():
    if os.path.exists('ai-comment.txt'):
        with open('ai-comment.txt', 'r', encoding='utf-8') as f:
            text = f.read()
        escaped_text = text.replace('`', '\\`')
        js_content = f"const aiCommentData = `{escaped_text}`;"
        with open('ai-comment.js', 'w', encoding='utf-8') as f:
            f.write(js_content)
        print("Updated ai-comment.js")
    else:
        print("Missing file: ai-comment.txt")

def sync_data_and_industry():
    industry_mapping = {}
    unique_industries = set()
    
    # 1. Read industry mapping
    if os.path.exists('stock_industry_classification.csv'):
        with open('stock_industry_classification.csv', 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            header = next(reader, None) # skip header
            for row in reader:
                if len(row) >= 2:
                    ticker = row[0].strip()
                    industry = row[1].strip()
                    industry_mapping[ticker] = industry
                    if industry:
                        unique_industries.add(industry)
    else:
        print("Missing file: stock_industry_classification.csv")
    
    # 2. Read data.csv, merge industry, and output to data.js
    if os.path.exists('data.csv'):
        with open('data.csv', 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            header = next(reader, None)
            
            if header:
                # remove any BOM from the first column header if present
                if header[0].startswith('\ufeff'):
                    header[0] = header[0].replace('\ufeff', '')
                header.append('Industry')
                
                rows = [','.join(header)]
                
                for row in reader:
                    if len(row) > 0:
                        ticker = row[0].strip()
                        industry = industry_mapping.get(ticker, '-')
                        row.append(industry)
                        # Re-join as CSV string
                        rows.append(','.join(row))
                        
                merged_csv_string = '\n'.join(rows)
                escaped_csv = merged_csv_string.replace('`', '\\`')
                
                # Prepare unique industries array
                sorted_industries = sorted(list(unique_industries))
                industries_json = json.dumps(sorted_industries, ensure_ascii=False)
                
                # Write to data.js
                with open('data.js', 'w', encoding='utf-8') as f:
                    f.write(f"const csvData = `{escaped_csv}`;\n")
                    f.write(f"const uniqueIndustries = {industries_json};\n")
                
                print("Updated data.js with merged Industry data")
                
                # Remove industry_data.js if it exists to avoid confusion
                if os.path.exists('industry_data.js'):
                    os.remove('industry_data.js')
                    print("Removed obsolete industry_data.js")
    else:
        print("Missing file: data.csv")

try:
    print("Syncing data locally...")
    sync_ai_comment()
    sync_data_and_industry()
    print("Done! Refresh your browser.")
except Exception as e:
    print(f"Error: {e}")
