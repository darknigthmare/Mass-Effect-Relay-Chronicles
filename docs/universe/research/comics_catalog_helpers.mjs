export const A=(key,name,fact,s,role,look,poses,move,extra={})=>({key,name,fact,s,role,look,poses,move:move?{name:move[0],rule:move[1],signal:move[2],accept:move[3]}:undefined,...extra});
export const W=(key,name,fact,s,goal,layout,landmark,look,path,hazard,sound,extra={})=>({key,name,fact,s,goal,layout,landmark,look,path,hazard,sound,...extra});
export const E=(key,name,fact,s,role,look,rule,motion,sound,moves,extra={})=>({key,name,fact,s,role,look,rule,motion,sound,moves:moves.map(m=>({name:m[0],text:m[1],rule:m[2],signal:m[3]})),...extra});
export const K=(cat,key,name,text,adapt,rule,look,motion,accept,extra={})=>({cat,key,name,text,adapt,rule,look,motion,accept,...extra});
export function S(s) {
  const p=s.prop;
  return {...s,structure:s.flow,prop:Array.isArray(p)?{name:p[0],text:p[1],use:p[2],rule:p[3],look:p[4]}:p,
    side:s.side?{name:s.side[0],task:s.side[1],reason:s.side[2],rule:s.side[3]}:undefined,
    tone:s.tone||`Préserver le thème « ${s.theme} »; échanges nouveaux, sans recopier les bulles.`,
    motion:s.motion||`Entrée prudente, geste d'inspection et retour au contrôle pour « ${s.label} »; poser les sprites avant tout changement de caméra.`,
    test:s.test||`Rejouer « ${s.label} » par les deux méthodes proposées, avec tâche facultative ignorée puis terminée, et en sautant le raccord.`,
    accept:s.accept||`L'objectif « ${s.label} » atteint son raccord annoncé après chaque méthode; sauvegarde, rechargement et saut de scène n'en changent ni le groupe ni les informations acquises.`};
}
export const common=(id,short)=>({id,short,reference:`Mass Effect: ${short}, série concernée`,filename:`Mass_Effect_${short.replace(/[^A-Za-z0-9]+/g,'_')}_Production.xlsx`,group:'Groupes limités aux protagonistes du segment; soutien narratif disponible sans recruter artificiellement tous les personnages.',atb:'ATB proposé limité aux confrontations jouables; les scènes de dialogue et d’enquête utilisent une pause complète.',persist:'Stocker le numéro/segment, la méthode locale, les indices acquis et le raccord déjà vu; ne pas écrire dans une sauvegarde canon du jeu.',verify:'Vérifier le bon numéro, les graphies, les costumes et le placement exact des séquences; aucune pagination non consultée fournie.',visibility:'Contrôler la taille des sprites, la séparation des silhouettes et les sorties sous la caméra fixe de chaque scène.',guard:'Les résultats d’adaptation locaux convergent vers les faits de l’œuvre; les personnages absents ne deviennent pas des alliés disponibles.',boundary:'La continuité éditoriale est distincte des essais de gameplay; un choix stratégique ne réécrit pas la fin publiée.'});
