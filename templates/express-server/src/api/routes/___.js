import express from "express";
import stream from "stream";
import accepts from 'accepts';
import querystring from "querystring";
import contentType from 'content-type';
import * as fs from 'fs';
import multer  from 'multer';
const upload = multer({dest:'/tmp/'});

const router = express.Router();

export default function(config) {

const { logger, client, swagger: { options: swaggerOptions } } = config;

{{#each operation}}
  {{#each this.path}}
    {{#validMethod @key}}


    {{#if ../extensions/x-hidden}}
   
    {{else}}
/**
 {{#each ../descriptionLines}}
 * {{{this}}}
 {{/each}}
 */
router.{{@key}}('{{#fixPathParameters ../../.}}{{../../subresource}}{{/fixPathParameters}}', {{#hasFiles ../requestBody}}upload.any(),{{/hasFiles}} async (req, res, next) => {
  
  const params = {
    {{#each ../parameters}}
      {{#equal this.in "query"}}
    {{../name}}: req.query.{{../name}}{{#unless @last}},{{/unless}}
      {{/equal}}
      {{#equal this.in "path"}}
    {{../name}}: req.params.{{../name}}{{#unless @last}},{{/unless}}
      {{/equal}}
      {{#match @../key "(post|put)"}}
        {{#equal ../in "requestBody"}}
    {{../name}}: req.body{{#unless @last}},{{/unless}}
        {{/equal}}
      {{/match}}
    {{/each}}
  };
  

  try 
  {  
      {{#hasFiles ../requestBody}}

      {{#createBody ../requestBody}}{{/createBody}}
      {{/hasFiles}}
      
      {{#hasFiles ../requestBody}}
      const result = await client.apis.{{../../../operation_name}}.{{../operationId}}(params,{...swaggerOptions(req,res),requestBody:requestBody{{#compare (lookup ../parameters 'length') 0 operator = '>' }}{{/compare}} }); 
      {{else}}
      {{#if ../requestBody}}
      const result = await client.apis.{{../../../operation_name}}.{{../operationId}}(params,{...swaggerOptions(req,res),requestBody:req.body{{#compare (lookup ../parameters 'length') 0 operator = '>' }}{{/compare}} }); 
      {{else}}
      const result = await client.apis.{{../../../operation_name}}.{{../operationId}}(params,swaggerOptions(req,res)); 
      {{/if}}
      {{/hasFiles}}

      {{#if ../extensions/x-session}}

      if( req.session ) { 
      {{#each ../extensions/x-session}} 
            {{#ifeq value.method 'merge'}}
             req.session.{{../key}} = {...req.session.{{../key}},...result.{{../value.field}} };
             {{/ifeq}}
           {{#ifeq value.method 'set'}}
           req.session.{{../key}} = result.{{../value.field}};
           {{/ifeq}}
     
      {{/each}}
      }
      {{/if}}

      {{#if ../extensions/x-headers}}
      {{#each ../extensions/x-headers}} 
      res.setHeader('{{@key}}','{{this}}' );
      {{/each}} 
      {{/if}}

      {{#if ../extensions/x-binary}} 
      if(result.headers['content-length'])
      {
        res.setHeader('content-length',result.headers['content-length'] );
      }
      const ptStream = new stream.PassThrough()
      stream.pipeline(
        result.data.stream(),ptStream,(err) => {
         if (err) {
           logger.error(err) // No such file or any other kind of error
           res.status(err.status || 500).json({ message: err.message });
           return;
         }
       })
       ptStream.pipe(res);
      return; 
      {{else}} 
      const ctHeader = !result.headers['content-type'] ? contentType.parse('application/json') : contentType.parse(result.headers['content-type']);
  
      if(ctHeader.type.includes( 'octet-stream' ))
      { 
        if(result.headers['content-length'])
        {
          res.setHeader('content-length',result.headers['content-length'] );
        }
        const ptStream = new stream.PassThrough()
        stream.pipeline(
          result.data.stream(),ptStream,(err) => {
           if (err) {
             logger.error(err) // No such file or any other kind of error
             res.status(err.status || 500).json({ message: err.message });
             return;
           }
         })
         ptStream.pipe(res);
        return;
      } else if(!ctHeader.type.includes( 'json' ))
      { 
        res.setHeader('content-type',result.headers['content-type'] );
        res.status(result.status || 200).send(result.text);
        return;
      } 

      res.status(result.status || 200).json(result.body);

      {{/if}}
      
      

  } catch (err) 
  {
      logger.error( err );
      if(!err.response)
      {
        res.status(err.status || 500).json({ message: err.message });
        return;
      }
      res.status(parseInt(err.response.body.code)).json({ message: err.response.body.message });
  }
});

{{/if}}
    {{/validMethod}}
 
  {{/each}}
{{/each}}

return router;

}
