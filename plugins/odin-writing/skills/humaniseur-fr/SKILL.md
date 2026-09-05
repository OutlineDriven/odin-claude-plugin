---
name: humaniseur-fr
description: 'Use when the user supplies French text that reads like AI output and asks to naturalize it. Not for English STE rewriting: use humanizer-en-asd-ste100.'
---

# Humaniseur fr

Naturalize French text that reads as AI-generated.

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User supplies French text and asks to naturalize, dérobotiser, rendre naturel, or similar |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Returns rewritten French text in the same turn; no durable writes |
| Done | Text is in the preserved register with no three AI signals co-occurring |

## Inputs

**Required:** French text to naturalize, in one of these forms:
- inline text in the message
- a file path to a `.txt` or `.md` file (read only; no write)

**Optional:** target register if the user states it (`soutenu`, `courant`, `familier`). If omitted, infer from vocabulary, morphology, and subject.

## Procedure

### One-pass rewrite

Apply **one pass only**. Do not iterate or re-apply.

**Rule 1: Register preservation.** Before rewriting, determine the register from the source text:
- soutenu: formal vocabulary, subjunctive mood, complex syntax, passive constructions, literary forms
- courant: neutral formal, standard written French, the default register for professional prose
- familier: informal vocabulary, colloquialisms, first-person constructions

Preserve the detected register throughout. Do not downgrade or upgrade.

**Rule 2: 80 % rule.** If a pattern appears in every sentence, fix it in no more than 80 % of those sentences. Fixing every instance makes the result read as over-corrected. Leave at least one raw instance per pattern class per paragraph.

**Rule 3: No three-signal co-occurrence.** Do not fix three different signal classes in the same sentence. Cap at two fix types per sentence.

### Pattern catalog (38 patterns)

Apply per-sentence. Stop scanning once a sentence has received its two-class cap.

#### Lexique pompier (AI vocabulary)

1. **Verbes creux.** `` il s'avère que '', `` il convient de '', `` force est de constater que '', `` il importe de '', `` il appert que '', `` il va sans dire que '', `` il n'en demeure pas moins que ''. Replace with a direct active verb or cut the clause entirely.
2. **Substantifs en -ité(abstraits).** `` implémentation '', `` granularité '', `` optimalité '', `` résilience '', `` scalabilité '', `` interdépendance '', `` contextualisation '', `` performativité '', `` modularité '', `` anticipabilité ''. Replace with the concrete noun or the plain verb.
3. **Formules de transition vides.** `` subséquemment '', `` par ailleurs '', `` dès lors '', `` en témoignent '', `` en guise de préalable '', `` à cet égard '', `` en guise de synthèse '', `` convient-il de''. Replace with `` ensuite '', `` aussi '', `` donc '', `` ainsi '', or delete the connector.
4. **Adverbes en -ment hyperboliques.** `` considérablement '', `` significativement '', `` amplement '', `` substantiellement '', `` on ne peut plus '', `` au plus haut point '', `` dramatiquement ''. Replace with the measured adjective or cut.
5. **Emprunts anglais non intégrés.** `` feedback '', `` roadmap '', `` mindset '', `` onboarding '', `` livrable '', `` bottleneck '', `` framework '', `` pipeline '', `` stakeholder '', `` backend '', `` frontend '', `` fullstack '', `` rollout '', `` benchmark '', `` backlog '', `` deadline '', `` sprint '', `` agile '', `` scoper '', `` pitcher '', `` solver '', `` matcher '', `` tracker '', `` killer-feature '', `` use-case '', `` best-of-breed '', `` end-to-end ''. Replace with the French term or write `` suivi '', `` lancement '', `` état d'esprit '', `` intégration '', `` livrable '', `` goulot d'étranglement '', `` structure '', `` chaîne '', `` partie prenante '', `` serveur '', `` interface '', `` pile complète '', `` déploiement '', `` référence '', `` carnet de commandes '', `` délai '', `` itération '', `` souple '', `` délimiter '', `` présenter '', `` résoudre '', `` appareiller '', `` suivre '', `` caractéristique décisive '', `` cas d'usage '', `` meilleur de sa catégorie '', `` de bout en bout ''.

#### Connecteurs

6. **Listes numérotées forcées.** `` Premièrement … Deuxièmement … Troisièmement … En conclusion ''. Natural prose rarely uses this structure in French outside legal texts. Integrate the items into the sentence flow or use `` d'abord … ensuite … enfin ''.
7. **Connecteurs en cascade.** Three or more `` par conséquent / ainsi / dès lors / en effet / moreover '' in the same paragraph. Reduce to one or two. Natural French uses fewer explicit connectors; the logic follows from the content.
8. **« Et ce, » et « ce, » comme relatives.** `` Le projet, et ce, malgré les obstacles … ''. Cut `` et ce '' and rewrite: `` Le projet, malgré les obstacles … ''.
9. **« Notamment / entre autres » en ouverture.** `` Notamment, nous observons … '', `` Entre autres, il faut … ''. These are weak openers. Replace with `` Nous observons … '', `` Il faut … ''.

#### Répétitions de registre pompier

10. **Synonymes en cascade.** `` le projet → la démarche → l'initiative → l'action '' in the same paragraph. Pick one term and hold it.
11. **« Bien que / malgré le fait que » redondants.** `` Malgré le fait que '', `` Au regard du fait que ''. Replace with `` bien que '', `` puisque '', `` car ''.
12. **« Etc. » à la fin de phrases.** `` Les composants incluent le serveur, la base de données, le cache, etc. ''; `` etc. '' rarely appears in careful French prose. Either list all items or write `` et d'autres composants ''.
13. **Tournures emphatiques.** `` Ce qui est particulièrement digne de mention, c'est que '', `` Il convient de souligner le fait que '', `` Il est à noter que '', `` Il est un fait que ''. Replace with the plain statement.
14. **Hyperonymies vides.** `` lesdites mesures '', `` à n'en pas douter '', `` il va sans dire '' (outside of `` il va sans dire que ''). Cut or replace.

#### Atténuation

15. **Atténuations systématiques.** `` dans une large mesure '', `` dans une certaine mesure '', `` dans une proportion significative '', `` il semble que '', `` il appert que '', `` il s'avère que '', `` en apparence '', `` à première vue '', `` sous certains aspects '', `` sous un certain angle '', `` force est de constater que '', `` il convient de relever ''. If the statement is factually supported, make it direct. If not, say `` nous ne disposons pas de données suffisantes pour … ''.
16. **Modaux superlatifs.** `` il est permis de croire que '', `` on serait tenté de penser que '', `` il ne serait pas exagéré de dire que '', `` il n'est pas aventureux d'affirmer que ''. Remove the modal framing and state the claim directly.
17. **Atténuations de conclusion.** `` En définitive / en dernière analyse / en dernier recours '', `` Force est de constater que '', `` force est de constater '', `` Tout compte fait '': used as sentence openers rather than as genuine summaries. Replace with a specific conclusion tied to the content.

#### Phrases de reformulation

18. **« En d'autres termes / Cela étant dit / Cela étant / Ceci étant »** followed by a near-identical repetition of the previous sentence. Cut or replace with genuine new information.
19. **« Quoiqu'il en soit / Toujours est-il que »** as openers when the preceding contrast has already been stated. If the contrast is in the previous sentence, `` mais '' or `` cependant '' suffices.
20. **« À l'instar de / De même que / À l'image de »** used as filler comparatives. `` À l'instar de X, Y '' is acceptable when X is a genuine parallel. Remove when the comparison is empty.

#### Voix passive et nominalisations

21. **Voix passive systématique.** `` a été réalisé par '', `` a été effectuée '', `` a été mise en place '', `` a été élaboré '', `` il a été procédé à '', `` il a été décidé de '', `` il a été constaté que '', `` il a été observé que '', `` il a été établi que ''. Replace with the active construction: `` nous avons réalisé '', `` l'équipe a effectué '', `` le système a été mis en place ''.
22. **Nominalisations lourdes.** `` la réalisation de '', `` la mise en œuvre de '', `` la mise en application de '', `` l'aboutissement de '', `` la procéduralisation de '', `` la contextualisation de ''. Replace with the verb: `` réaliser '', `` mettre en œuvre '', `` appliquer '', `` aboutir '', `` contextualiser ''.
23. **Pronominalisations faibles.** `` se trouver être '', `` venir à '', `` en venir à '', `` il appert que '', `` il s'ensuit que ''. Replace with direct verbs.
24. **Doubles négations de politesse.** `` il n'est pas impossible que '', `` il n'est pas inexact de '', `` il n'est pas totalement faux de '', `` il n'est pas rare que '' (when used to hedge). Either state the probability directly or replace with `` souvent '', `` parfois '', `` rarement ''.

#### Formules de remplissage

25. **« Dans le cadre de / au titre de / en tant que / en qualité de »** used as empty connectors. `` Dans le cadre de nos travaux, nous avons … '' → `` Nous avons … ''.
26. **« D'une manière générale / de façon générale / en règle générale »** as openers. Either move to the end of the paragraph as a genuine summary or replace with a specific opening.
27. **Phrases creuses de transition.** `` Il convient de noter que '', `` Il est important de noter que '', `` Il convient de relever que '', `` Il importe de préciser que '', `` Il est loisible de penser que ''. Cut or replace with the content that follows.
28. **Référence à la méthode ou au processus.** `` Comme nous l'avons vu / Comme évoqué précédemment / Comme indiqué ci-dessus /Tel que nous l'avons analysé '' in mid-text. Either reference the specific point (`` voir la section 2 '') or integrate the content directly.

#### Patterns supplémentaires

29. **Ponctuation emphatique.** Triple point (`` … ''), tiret d'incise en cascade (`` — — ''), deux-points après une seule phrase (`` : ''). Natural French uses shorter emphatic punctuation. Reduce.
30. **Formules de clôture.** `` En définitive '', `` Pour tout dire '', `` En dernière analyse '', `` En dernier ressort '', `` Tout bien considéré '', `` En conclusion de quoi '', when used as pure closers without new content. Integrate the conclusion into the last sentence or cut.
31. **Formules protocolaires.** `` Eu égard à '', `` Attendu que '', `` Vu que '', `` Dans la mesure où '' (when not establishing a legal condition). Replace with `` comme '', `` puisque '', `` car ''.
32. **Métaphores techniques non fieldées.** `` Cela ouvre la voie à '', `` Cela permet de '', `` Cela constitue un pas en avant '', `` Cela représente un enjeu majeur '', `` Cela constitue un défi de taille ''. Replace with the concrete consequence.
33. **Doubles comparatifs.** `` plus ⋯ plus ⋯ '' or `` moins ⋯ moins ⋯ '' used without proportional content. `` Plus le projet avance, plus les coûts augmentent '' is acceptable. `` Plus ⋯ plus '' without a logical link is not.
34. **Absence d'article défini.** `` de manière significative '', `` en termes de '' (empty). `` De manière significative '' → `` beaucoup '', `` peu '', `` modérément ''. `` En termes de '' → name the domain directly.
35. **Anglicismes orthographiques.** `` benchmarker '', `` scoper '', `` pitcher '', `` solver '', `` tracker '', `` wrapper '', `` killer '', `` setup '', `` release '', `` build '', `` test '', `` fix '', `` patch '', `` debug '', `` feature '', `` bug '', `` hotfix '', `` release note '', `` roadmap '', `` changelog '', `` backlog '', `` sprint '', `` scrum '', `` Kanban '', `` KPI '', `` OKR '', `` SLA '', `` MVP '', `` P0 '', `` onboarding '', `` offboarding '', `` feedback '', `` feedforward '', `` mindset '', `` skillset '', `` workflow '', `` pipeline '', `` stream '', `` user story '', `` epic '', `` milestone '', `` blocker '', `` dependency '', `` integration '', `` rollout '', `` upgrade '', `` downgrade '', `` deploy '', `` ship '', `` bounce '', `` pull '', `` push '', `` fork '', `` clone '', `` merge '', `` branch '', `` commit '', `` checkout '', `` rebase '', `` squash '', `` cherry-pick '', `` tag '', `` release '', `` hotfix '', `` patch '', `` version '', `` major '', `` minor '', `` patch '', `` semver '', `` breaking change '', `` changelog '', `` issue '', `` ticket '', `` story '', `` epic '', `` user case '', `` use case ''. Replace with the French equivalent.
36. **Anglicismes syntaxiques.** `` le sujet X '' instead of `` à propos de X '', `` avoir un impact sur '' instead of `` affecter '', `` avoir lieu '' instead of `` se dérouler '', `` être en ligne avec '' instead of `` correspondre à '', `` en temps réel '' instead of `` instantanément ''.
37. **« À noter » en début de paragraphe.** `` À noter que '', `` Il est à noter que ''. These are filler openers. `` À noter : '' is acceptable as a marginal annotation, not as a paragraph opener.
38. **Listes hybrides.** Mixing numbered and bulleted lists in the same list. Use one consistent format.

## Failure and recovery
| Failure class | Condition | Result |
|---|---|---|
| Empty input | No text supplied and no file readable | Return: `` Veuillez fournir du texte français à naturaliser.'' |
| Unsupported language | Source text is not French (> 50 % non-French tokens) | Return: `` Ce texte n'est pas en français. Cette compétence s'applique uniquement au français.'' |
| Binary file | File path points to a non-text file | Return: `` Le fichier n'est pas lisible comme texte.'' |
| Register ambiguity | Register cannot be determined from the source | Default to `` courant '' (neutral formal). State the choice. |
| Three-class cap reached | A sentence already has three classes flagged | Skip further fixes in that sentence; do not add more. |
| Over-fix risk (80 % rule) | Pattern appears in every sentence | Leave at least one raw instance; do not fix all. |

**Partial-result rule:** if the text is long, apply the catalog one paragraph at a time. If interrupted, return the paragraphs already processed and state: `` Naturalisation partielle : N paragraphes sur M traités.''

## Output
Return the rewritten French text in the preserved register, with no more than two pattern-class fixes per sentence, and no pattern fixed in more than 80 % of its instances across the whole text.
