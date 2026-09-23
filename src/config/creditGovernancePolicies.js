export const DEFAULT_DELEGATION_MATRIX = Object.freeze([
  Object.freeze({id:'LEVEL-1',minAmount:0,maxAmount:4999999,authority:'Caisse de crédit',requiredValidations:1,committeeRequired:true,derogation:'Selon politique institutionnelle'}),
  Object.freeze({id:'LEVEL-2',minAmount:5000000,maxAmount:24999999,authority:'Niveau supérieur paramétrable',requiredValidations:2,committeeRequired:true,derogation:'Approbation renforcée requise'}),
  Object.freeze({id:'LEVEL-3',minAmount:25000000,maxAmount:null,authority:'Direction générale',requiredValidations:2,committeeRequired:true,derogation:'Selon délégation formalisée'})
]);
export function authorityForAmount(amount,matrix=DEFAULT_DELEGATION_MATRIX){const n=Number(amount||0);return matrix.find(x=>n>=x.minAmount&&(x.maxAmount==null||n<=x.maxAmount))||null;}
export function validateDelegationMatrix(matrix){if(!Array.isArray(matrix)||!matrix.length)throw new TypeError('delegation matrix required');for(const x of matrix){if(!x.id||!x.authority||Number(x.minAmount)<0||Number(x.requiredValidations)<1)throw new TypeError('invalid delegation level');}return true;}
