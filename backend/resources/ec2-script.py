import boto3
import os

def download_from_s3(bucket_name, s3_key, local_file_path):
    s3 = boto3.client('s3')
    s3.download_file(bucket_name, s3_key, local_file_path)

def get_item_from_dynamodb(table_name, item_id):
    table = boto3.resource('dynamodb').Table(table_name)
    item = table.get_item(Key={'id': item_id})
    return item

def put_item_in_dynamodb(table_name, item):
    table = boto3.resource('dynamodb').Table(table_name)
    table.put_item(item)

def append_text_length_to_file(file_path, text):
    text_length = len(text)
    with open(file_path, 'a') as file:
        file.write(f": {text_length}")
    new_file_name = file_path.split(".")[:-1]
    new_file_name += ".output"
    os.rename(file, new_file_name)
    return new_file_name

def upload_to_s3(bucket_name, s3_key, local_file_path):
    s3 = boto3.client('s3')    
    s3.upload_file(local_file_path, bucket_name, s3_key)

def main():
    input_bucket_name = os.environ["INPUT_BUCKET_NAME"]
    table_name = os.environ["INPUT_TABLE_NAME"]
    id = os.environ["INPUT_ID"]
    output_bucket_name = os.environ["OUTPUT_BUCKET_NAME"]

    item = get_item_from_dynamodb(table_name, id)
    
    input_text= item['input_text']
    input_file_path =  item['input_file_path']

    input_file_key = "/".join(input_file_path.split("/")[1:])
    file_name = input_file_path.split("/")[-1]
    download_from_s3(input_bucket_name, input_file_key, file_name)

    new_file_name = append_text_length_to_file(file_name, input_text)
    output_file_key = "/".join(input_file_path.split("/")[1:]) + "/" + new_file_name
    
    upload_to_s3(output_bucket_name, output_file_key, new_file_name )
    
    output_file_path = output_bucket_name + "/" + output_file_key
    item["output_file_path"] = output_file_path
    
    put_item_in_dynamodb(table_name, item)