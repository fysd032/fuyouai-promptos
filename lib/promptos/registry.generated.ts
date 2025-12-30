// ⚠️ 本文件由 scripts/generate-prompt-registry.cjs 自动生成，请勿手动修改。
import type { PromptModule } from "./prompts";

import m_A1_01_writing_generator from "../../public/modules/A1-01-writing-generator.json";
import m_A1_02_copywriting_generator from "../../public/modules/A1-02-copywriting-generator.json";
import m_A1_03_social_post_generator from "../../public/modules/A1-03-social-post-generator.json";
import m_A1_04_blog_generator from "../../public/modules/A1-04-blog-generator.json";
import m_A1_05_script_generator from "../../public/modules/A1-05-script-generator.json";
import m_A2_01_Business_Email_Generator from "../../public/modules/A2-01-Business Email Generator.json";
import m_A2_02_English_Email_Generator from "../../public/modules/A2-02-English Email Generator.json";
import m_A2_03_Email_Reply_Template_Generator from "../../public/modules/A2-03-Email Reply Template Generator.json";
import m_A3_01_title_generator from "../../public/modules/A3-01-title-generator.json";
import m_A3_02_short_sentence_generator from "../../public/modules/A3-02-short-sentence-generator.json";
import m_A3_03_cta_generator from "../../public/modules/A3-03-cta-generator.json";
import m_A3_04_viral_style_template_generator from "../../public/modules/A3-04-viral-style-template-generator.json";
import m_A4_01_ppt_structure_generator from "../../public/modules/A4-01-ppt-structure-generator.json";
import m_A4_02_ppt_content_and_script_generator from "../../public/modules/A4-02-ppt-content-and-script-generator.json";
import m_A4_03_ppt_visual_design_generator from "../../public/modules/A4-03-ppt-visual-design-generator.json";
import m_A4_04_ppt_chart_generator from "../../public/modules/A4-04-ppt-chart-generator.json";
import m_A4_05_ppt_storyline_generator from "../../public/modules/A4-05-ppt-storyline-generator.json";
import m_A4_06_ppt_copy_optimizer from "../../public/modules/A4-06-ppt-copy-optimizer.json";
import m_A4_07_pitch_deck_generator from "../../public/modules/A4-07-pitch-deck-generator.json";
import m_A5_01_weekly_report_generator from "../../public/modules/A5-01-weekly-report-generator.json";
import m_A5_02_work_summary_generator from "../../public/modules/A5-02-work-summary-generator.json";
import m_A5_03_work_plan_generator from "../../public/modules/A5-03-work-plan-generator.json";
import m_A5_04_proposal_generator from "../../public/modules/A5-04-proposal-generator.json";
import m_A6_01_bilingual_draft_generator from "../../public/modules/A6-01-bilingual-draft-generator.json";
import m_A6_02_localization_generator from "../../public/modules/A6-02-localization-generator.json";
import m_A6_03_tone_preserving_translation_generator from "../../public/modules/A6-03-tone-preserving-translation-generator.json";
import m_B1_01_business_polish from "../../public/modules/B1-01-business-polish.json";
import m_B1_03_oral_to_written from "../../public/modules/B1-03-oral-to-written.json";
import m_B2_01_rewrite_generator from "../../public/modules/B2-01-rewrite-generator.json";
import m_B2_02_expand_generator from "../../public/modules/B2-02-expand-generator.json";
import m_B2_03_compress_generator from "../../public/modules/B2-03-compress-generator.json";
import m_B3_01_table_to_document from "../../public/modules/B3-01-table-to-document.json";
import m_B3_02_document_to_ppt from "../../public/modules/B3-02-document-to-ppt.json";
import m_B3_03_longtext_to_keypoints from "../../public/modules/B3-03-longtext-to-keypoints.json";
import m_B3_04_video_to_document from "../../public/modules/B3-04-video-to-document.json";
import m_B3_05_document_to_script from "../../public/modules/B3-05-document-to-script.json";
import m_B3_06_audio_to_structure from "../../public/modules/B3-06-audio-to-structure.json";
import m_B4_01_multimodal_composition_generator from "../../public/modules/B4-01-multimodal-composition-generator.json";
import m_B4_02_knowledge_cards_generator from "../../public/modules/B4-02-knowledge-cards-generator.json";
import m_B4_03_knowledge_base_structure_generator from "../../public/modules/B4-03-knowledge-base-structure-generator.json";
import m_B4_04_knowledgecards_to_faq_botbase_generator from "../../public/modules/B4-04-knowledgecards-to-faq-botbase-generator.json";
import m_B4_05_content_standardization_generator from "../../public/modules/B4-05-content-standardization-generator.json";
import m_C1_01_cot_reasoning_module from "../../public/modules/C1-01-cot-reasoning-module.json";
import m_C1_02_task_decomposition_generator from "../../public/modules/C1-02-task-decomposition-generator.json";
import m_C1_03_decision_matrix_generator from "../../public/modules/C1-03-decision-matrix-generator.json";
import m_C1_04_market_research_insight_generator from "../../public/modules/C1-04-market-research-insight-generator.json";
import m_C1_05_user_insight_generator from "../../public/modules/C1-05-user-insight-generator.json";
import m_C1_06_product_diagnosis_generator from "../../public/modules/C1-06-product-diagnosis-generator.json";
import m_C2_01_Data_Understanding_Module from "../../public/modules/C2-01-Data Understanding Module.json";
import m_C2_02_Data_Insight_Module from "../../public/modules/C2-02-Data Insight Module.json";
import m_C2_3_Data_Meaning_Module from "../../public/modules/C2-3-Data Meaning Module.json";
import m_C2_4_Data_Action_Module from "../../public/modules/C2-4-Data Action Module.json";
import m_D1_01_Meeting_Summary_Generator from "../../public/modules/D1-01-Meeting Summary Generator.json";
import m_D1_02_Action_Items_Extractor from "../../public/modules/D1-02-Action Items Extractor.json";
import m_D1_03_Structured_Meeting_Document_Generator from "../../public/modules/D1-03-Structured Meeting Document Generator.json";
import m_D3_01_In_depth_Interview_Question_Generator from "../../public/modules/D3-01-In-depth Interview Question Generator.json";
import m_D3_02_Structured_Interview_Outline_Generator from "../../public/modules/D3-02-Structured Interview Outline Generator.json";
import m_D4_01_Knowledge_Graph_Extraction_Module from "../../public/modules/D4-01-Knowledge Graph Extraction Module.json";
import m_E1_01_Workflow_Design_Module from "../../public/modules/E1-01-Workflow Design Module.json";
import m_E1_02_Action_Plan_Generator from "../../public/modules/E1-02-Action Plan Generator.json";
import m_E2_03_Analyst_Role_Agent from "../../public/modules/E2-03-Analyst Role Agent.json";
import m_E2_05_Editor_Role_Agent from "../../public/modules/E2-05-Editor Role Agent.json";
import m_E2_06_Strategist_Role_Agent from "../../public/modules/E2-06-Strategist Role Agent.json";
import m_E2_07_Product_Manager_Role_Agent from "../../public/modules/E2-07-Product Manager Role Agent.json";
import m_E2_08_Coach_Role_Agent from "../../public/modules/E2-08-Coach Role Agent.json";
import m_E2_9_Legal_Review_Role_Agent from "../../public/modules/E2-9-Legal Review Role Agent.json";
import m_E2_04_Consultant_Role_Agent from "../../public/modules/E2=04-Consultant Role Agent.json";
import m_E3_01_self_reflection_module from "../../public/modules/E3-01-self-reflection-module.json";
import m_E3_02_error_checking_module from "../../public/modules/E3-02-error-checking-module.json";
import m_E3_03_quality_scoring_module from "../../public/modules/E3-03-quality-scoring-module.json";
import m_E4_01_long_task_chain_orchestrator from "../../public/modules/E4-01-long-task-chain-orchestrator.json";
import m_E4_02_multistep_auto_executor from "../../public/modules/E4-02-multistep-auto-executor.json";
import m_E5_01_academic_abstract_generator from "../../public/modules/E5-01-academic-abstract-generator.json";
import m_E5_02_academic_model_framework_builder from "../../public/modules/E5-02-academic-model-framework-builder.json";
import m_E5_03_theory_explanation_module from "../../public/modules/E5-03-theory-explanation-module.json";
import m_E5_04_literature_review_generator from "../../public/modules/E5-04-literature-review-generator.json";
import m_E6_01_meeting_minutes_generator from "../../public/modules/E6-01-meeting-minutes-generator.json";
import m_E6_02_business_report_generator from "../../public/modules/E6-02-business-report-generator.json";
import m_E6_03_business_dialogue_generator from "../../public/modules/E6-03-business-dialogue-generator.json";

export const modulesRegistry: Record<string, PromptModule> = {
  "A1-01": m_A1_01_writing_generator,
  "A1-02": m_A1_02_copywriting_generator,
  "A03": m_A1_03_social_post_generator,
  "A04": m_A1_04_blog_generator,
  "A05": m_A1_05_script_generator,
  "A2-01": m_A2_01_Business_Email_Generator,
  "A2-02": m_A2_02_English_Email_Generator,
  "A2-03": m_A2_03_Email_Reply_Template_Generator,
  "A3-01": m_A3_01_title_generator,
  "A3-02": m_A3_02_short_sentence_generator,
  "A3-03": m_A3_03_cta_generator,
  "A3-04": m_A3_04_viral_style_template_generator,
  "A4-01": m_A4_01_ppt_structure_generator,
  "A4-02": m_A4_02_ppt_content_and_script_generator,
  "A4-03": m_A4_03_ppt_visual_design_generator,
  "A4-04": m_A4_04_ppt_chart_generator,
  "A4-05": m_A4_05_ppt_storyline_generator,
  "A4-06": m_A4_06_ppt_copy_optimizer,
  "A4-07": m_A4_07_pitch_deck_generator,
  "A5-01": m_A5_01_weekly_report_generator,
  "A5-02": m_A5_02_work_summary_generator,
  "A5-03": m_A5_03_work_plan_generator,
  "A5-04": m_A5_04_proposal_generator,
  "A6-01": m_A6_01_bilingual_draft_generator,
  "A6-02": m_A6_02_localization_generator,
  "A6-03": m_A6_03_tone_preserving_translation_generator,
  "B1-01": m_B1_01_business_polish,
  "B1-03": m_B1_03_oral_to_written,
  "B2-01": m_B2_01_rewrite_generator,
  "B2-02": m_B2_02_expand_generator,
  "B2-03": m_B2_03_compress_generator,
  "B3-01": m_B3_01_table_to_document,
  "B3-02": m_B3_02_document_to_ppt,
  "B3-03": m_B3_03_longtext_to_keypoints,
  "B3-04": m_B3_04_video_to_document,
  "B3-05": m_B3_05_document_to_script,
  "B3-06": m_B3_06_audio_to_structure,
  "B4-01": m_B4_01_multimodal_composition_generator,
  "B4-02": m_B4_02_knowledge_cards_generator,
  "B4-03": m_B4_03_knowledge_base_structure_generator,
  "B4-04": m_B4_04_knowledgecards_to_faq_botbase_generator,
  "B4-05": m_B4_05_content_standardization_generator,
  "C1-01": m_C1_01_cot_reasoning_module,
  "C1-02": m_C1_02_task_decomposition_generator,
  "C1-03": m_C1_03_decision_matrix_generator,
  "C1-04": m_C1_04_market_research_insight_generator,
  "C1-05": m_C1_05_user_insight_generator,
  "C1-06": m_C1_06_product_diagnosis_generator,
  "C2-01": m_C2_01_Data_Understanding_Module,
  "C2-02": m_C2_02_Data_Insight_Module,
  "C2-03": m_C2_3_Data_Meaning_Module,
  "C2-04": m_C2_4_Data_Action_Module,
  "D1-01": m_D1_01_Meeting_Summary_Generator,
  "D1-02": m_D1_02_Action_Items_Extractor,
  "D1-03": m_D1_03_Structured_Meeting_Document_Generator,
  "D3-01": m_D3_01_In_depth_Interview_Question_Generator,
  "D3-02": m_D3_02_Structured_Interview_Outline_Generator,
  "D4-01": m_D4_01_Knowledge_Graph_Extraction_Module,
  "E1-01": m_E1_01_Workflow_Design_Module,
  "E1-02": m_E1_02_Action_Plan_Generator,
  "E2-03": m_E2_03_Analyst_Role_Agent,
  "E2-05": m_E2_05_Editor_Role_Agent,
  "E2-06": m_E2_06_Strategist_Role_Agent,
  "E2-07": m_E2_07_Product_Manager_Role_Agent,
  "E2-08": m_E2_08_Coach_Role_Agent,
  "E2-09": m_E2_9_Legal_Review_Role_Agent,
  "E2-04": m_E2_04_Consultant_Role_Agent,
  "E3-01": m_E3_01_self_reflection_module,
  "E3-02": m_E3_02_error_checking_module,
  "E3-03": m_E3_03_quality_scoring_module,
  "E4-01": m_E4_01_long_task_chain_orchestrator,
  "E4-02": m_E4_02_multistep_auto_executor,
  "E5-01": m_E5_01_academic_abstract_generator,
  "E5-02": m_E5_02_academic_model_framework_builder,
  "E5-03": m_E5_03_theory_explanation_module,
  "E5-04": m_E5_04_literature_review_generator,
  "E6-01": m_E6_01_meeting_minutes_generator,
  "E6-02": m_E6_02_business_report_generator,
  "E6-03": m_E6_03_business_dialogue_generator,
};
