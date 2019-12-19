import express from "express";
import accepts from 'accepts';
import querystring from "querystring";

const router = express.Router();

export default function(config) {

const { logger, client, swagger: { options: swaggerOptions } } = config;

{{#each operation}}
  {{#each this.path}}
    {{#validMethod @key}}
/**
 {{#each ../descriptionLines}}
 * {{{this}}}
 {{/each}}
 */
router.{{@key}}('{{#fixPathParameters ../../.}}{{../../subresource}}{{/fixPathParameters}}', async (req, res, next) => {
  
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
      {{#if ../requestBody}}
      const result = await client.apis.{{../../../operation_name}}.{{../operationId}}(params,{...swaggerOptions(req,res),requestBody:req.body{{#compare (lookup ../parameters 'length') 0 operator = '>' }}{{/compare}} }); 
      {{else}}
      const result = await client.apis.{{../../../operation_name}}.{{../operationId}}(params,swaggerOptions(req,res)); 
      {{/if}}
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
      
      if(!result.headers['content-type'] || !accepts(req).type(['json']))
      {
        res.setHeader('content-type', result.headers['content-type']);
        res.status(result.status || 200).send(result.text);
        return;
      }

      res.status(result.status || 200).json(result.body);

  } catch (err) 
  {
      logger.error({ err });
      if(!err.response)
      {
        res.status(err.status || 500).json({ message: err.message });
        return;
      }
      res.status(parseInt(err.response.body.code)).json({ message: err.response.body.message });
  }
});

    {{/validMethod}}
  {{/each}}
{{/each}}

return router;

}
