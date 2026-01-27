import { MedicalTest, TestPackage } from '@/types';

export const DEFAULT_TESTS: MedicalTest[] = [
    // --- Imaging ---
    {
        id: 'chest-xray',
        name: 'Chest X-Ray',
        category: 'Imaging',
        description: 'Radiographic imaging of the chest to assess heart and lungs.',
        preparation: 'Remove metal objects.',
        sampleType: 'N/A',
        turnaroundTime: '15-30 mins',
        commonUses: ['Pneumonia', 'Tubuerculosis', 'Fractures']
    },
    {
        id: 'mri-brain',
        name: 'MRI Brain',
        category: 'Imaging',
        description: 'Detailed magnetic resonance imaging of the brain.',
        preparation: 'Remove all metal. Fasting may be required.',
        sampleType: 'N/A',
        turnaroundTime: '24 hours',
        commonUses: ['Headaches', 'Stroke', 'Tumors']
    },
    {
        id: 'uss-abd',
        name: 'Abdominal Ultrasound',
        category: 'Imaging',
        description: 'Ultrasound scan of abdominal organs (liver, kidney, etc).',
        preparation: 'Fasting for 6-8 hours.',
        sampleType: 'N/A',
        turnaroundTime: 'Immediate',
        commonUses: ['Liver check', 'Kidney stones', 'Pregnancy']
    },
    {
        id: 'ct-scan-head',
        name: 'CT Scan (Head)',
        category: 'Imaging',
        description: 'Computed Tomography scan of the head.',
        preparation: 'None usually.',
        sampleType: 'N/A',
        turnaroundTime: '1-2 hours',
        commonUses: ['Trauma', 'Stroke']
    },
    {
        id: 'mammogram',
        name: 'Mammography',
        category: 'Imaging',
        description: 'X-ray screening of the breasts for cancer.',
        preparation: 'Do not use deodorant/powder.',
        sampleType: 'N/A',
        turnaroundTime: '1-2 days',
        commonUses: ['Breast Cancer Screening']
    },

    // --- Haematology ---
    {
        id: 'fbc',
        name: 'Full Blood Count (FBC)',
        category: 'Haematology',
        description: 'Complete assessment of blood cells (RBC, WBC, Platelets).',
        preparation: 'No fasting required.',
        sampleType: 'Blood',
        turnaroundTime: '2-4 hours',
        commonUses: ['Anemia', 'Infection', 'Leukemia']
    },
    {
        id: 'genotype',
        name: 'Haemoglobin Genotype',
        category: 'Haematology',
        description: 'Determines genotype (AA, AS, SS) for sickle cell screening.',
        preparation: 'None.',
        sampleType: 'Blood',
        turnaroundTime: '24 hours',
        commonUses: ['Sickle Cell Screening', 'Pre-marriage']
    },
    {
        id: 'blood-group',
        name: 'Blood Group & Rhesus',
        category: 'Haematology',
        description: 'Identifies blood group (A, B, AB, O) and Rhesus factor.',
        preparation: 'None.',
        sampleType: 'Blood',
        turnaroundTime: '1 hour',
        commonUses: ['Transfusion', 'Pre-marriage', 'Pregnancy']
    },
    {
        id: 'esr',
        name: 'Erythrocyte Sedimentation Rate (ESR)',
        category: 'Haematology',
        description: 'Non-specific marker for inflammation in the body.',
        preparation: 'None.',
        sampleType: 'Blood',
        turnaroundTime: '2 hours',
        commonUses: ['Inflammation', 'Infection']
    },

    // --- Clinical Chemistry ---
    {
        id: 'lipid',
        name: 'Lipid Profile',
        category: 'Clinical Chemistry',
        description: 'Measures Cholesterol (Total, HDL, LDL) and Triglycerides.',
        preparation: '12-hour fasting.',
        sampleType: 'Blood',
        turnaroundTime: '24 hours',
        commonUses: ['Heart disease risk', 'Cholesterol']
    },
    {
        id: 'fasting-sugar',
        name: 'Fasting Blood Sugar (FBS)',
        category: 'Clinical Chemistry',
        description: 'Measures glucose levels after overnight fasting.',
        preparation: '8-10 hour fasting.',
        sampleType: 'Blood',
        turnaroundTime: '2 hours',
        commonUses: ['Diabetes Diagnosis', 'Monitoring']
    },
    {
        id: 'hba1c',
        name: 'HbA1c (Glycated Haemoglobin)',
        category: 'Clinical Chemistry',
        description: 'Average blood sugar over the last 3 months.',
        preparation: 'None.',
        sampleType: 'Blood',
        turnaroundTime: '2-24 hours',
        commonUses: ['Long-term Diabetes Control']
    },
    {
        id: 'lft',
        name: 'Liver Function Test (LFT)',
        category: 'Clinical Chemistry',
        description: 'Assesses liver health (AST, ALT, Bilirubin, etc).',
        preparation: 'None.',
        sampleType: 'Blood',
        turnaroundTime: '24 hours',
        commonUses: ['Liver Disease', 'Alcohol use']
    },
    {
        id: 'eucr',
        name: 'Kidney Function Test (E/U/Cr)',
        category: 'Clinical Chemistry',
        description: 'Electrolytes, Urea, and Creatinine levels.',
        preparation: 'None.',
        sampleType: 'Blood',
        turnaroundTime: '4-6 hours',
        commonUses: ['Kidney Health', 'Dehydration']
    },

    // --- Microbiology ---
    {
        id: 'malaria',
        name: 'Malaria Parasite (MP)',
        category: 'Microbiology',
        description: 'Microscopic or Rapid test for malaria.',
        preparation: 'None.',
        sampleType: 'Blood',
        turnaroundTime: '1 hour',
        commonUses: ['Fever', 'Malaria']
    },
    {
        id: 'widal',
        name: 'Widal Test',
        category: 'Microbiology',
        description: 'Serological test for Typhoid fever.',
        preparation: 'None.',
        sampleType: 'Blood',
        turnaroundTime: '2 hours',
        commonUses: ['Typhoid Fever']
    },
    {
        id: 'urine-mcs',
        name: 'Urine M/C/S',
        category: 'Microbiology',
        description: 'Microscopy, Culture and Sensitivity of urine.',
        preparation: 'Sterile sample collection.',
        sampleType: 'Urine',
        turnaroundTime: '48-72 hours',
        commonUses: ['UTI', 'Infection']
    },
    {
        id: 'stool-mcs',
        name: 'Stool M/C/S',
        category: 'Microbiology',
        description: 'Culture of stool sample for checking infections.',
        preparation: 'Fresh stool sample.',
        sampleType: 'Stool',
        turnaroundTime: '48-72 hours',
        commonUses: ['Diarrhea', 'Food Poisoning']
    },

    // --- Immunology/Serology ---
    {
        id: 'hiv',
        name: 'HIV Screening',
        category: 'Immunology/Serology',
        description: 'Screening for HIV 1 & 2 antibodies.',
        preparation: 'None.',
        sampleType: 'Blood',
        turnaroundTime: '30 mins',
        commonUses: ['HIV Status', 'Pre-marriage']
    },
    {
        id: 'hbsag',
        name: 'Hepatitis B Surface Antigen',
        category: 'Immunology/Serology',
        description: 'Screening for Hepatitis B infection.',
        preparation: 'None.',
        sampleType: 'Blood',
        turnaroundTime: '1-2 hours',
        commonUses: ['Liver Check', 'Hepatitis']
    },
    {
        id: 'hcv',
        name: 'Hepatitis C Screening',
        category: 'Immunology/Serology',
        description: 'Screening for Hepatitis C virus.',
        preparation: 'None.',
        sampleType: 'Blood',
        turnaroundTime: '1-2 hours',
        commonUses: ['Liver Check', 'Hepatitis']
    },
    {
        id: 'vdrl',
        name: 'VDRL / Syphilis',
        category: 'Immunology/Serology',
        description: 'Screening for Syphilis infection.',
        preparation: 'None.',
        sampleType: 'Blood',
        turnaroundTime: '2 hours',
        commonUses: ['STI Check', 'Pre-marriage']
    },

    // --- Hormonal Assays ---
    {
        id: 'tft',
        name: 'Thyroid Function Test (TFT)',
        category: 'Hormonal Assays',
        description: 'T3, T4, and TSH levels.',
        preparation: 'None.',
        sampleType: 'Blood',
        turnaroundTime: '24-48 hours',
        commonUses: ['Thyroid Disorders', 'Goiter']
    },
    {
        id: 'beta-hcg',
        name: 'Beta-HCG (Pregnancy)',
        category: 'Hormonal Assays',
        description: 'Quantitative test for pregnancy hormone.',
        preparation: 'None.',
        sampleType: 'Blood',
        turnaroundTime: '4-6 hours',
        commonUses: ['Pregnancy Confirmation']
    },
    {
        id: 'hormone-profile',
        name: 'Fertility Hormone Profile',
        category: 'Hormonal Assays',
        description: 'FSH, LH, Prolactin, Progesterone.',
        preparation: 'Specific cycle days often required.',
        sampleType: 'Blood',
        turnaroundTime: '2-3 days',
        commonUses: ['Infertility Investigation']
    },

    // --- Tumor Markers ---
    {
        id: 'psa',
        name: 'PSA (Prostate Specific Antigen)',
        category: 'Tumor Markers',
        description: 'Screening and monitoring for prostate cancer.',
        preparation: 'Avoid ejaculation 48hrs prior.',
        sampleType: 'Blood',
        turnaroundTime: '24 hours',
        commonUses: ['Prostate Cancer']
    },
    {
        id: 'ca125',
        name: 'CA-125',
        category: 'Tumor Markers',
        description: 'Marker mainly for Ovarian Cancer.',
        preparation: 'None.',
        sampleType: 'Blood',
        turnaroundTime: '2-3 days',
        commonUses: ['Ovarian Cancer']
    },

    // --- Coagulation ---
    {
        id: 'inr',
        name: 'PT / INR',
        category: 'Coagulation Profile',
        description: 'Checks blood clotting time.',
        preparation: 'None.',
        sampleType: 'Blood',
        turnaroundTime: '4-6 hours',
        commonUses: ['blood thinners monitoring', 'Pre-surgery']
    },

    // --- Cardiac Markers ---
    {
        id: 'troponin',
        name: 'Troponin I',
        category: 'Cardiac Markers',
        description: 'Specific marker for heart muscle damage.',
        preparation: 'None.',
        sampleType: 'Blood',
        turnaroundTime: '1-2 hours',
        commonUses: ['Heart Attack Diagnosis']
    },

    // --- Urinalysis ---
    {
        id: 'urinalysis',
        name: 'Urinalysis (Full)',
        category: 'Urinalysis',
        description: 'Dipstick chemistry and microscopy of urine.',
        preparation: 'Fresh urine sample.',
        sampleType: 'Urine',
        turnaroundTime: '1 hour',
        commonUses: ['UTI', 'Kidney Disease', 'Diabetes']
    },

    // --- Stool ---
    {
        id: 'stool-micro',
        name: 'Stool Microscopy',
        category: 'Stool Tests',
        description: 'Examining stool for ova and parasites.',
        preparation: 'Fresh stool sample.',
        sampleType: 'Stool',
        turnaroundTime: '1-2 hours',
        commonUses: ['Worms', 'Parasites']
    },

    // --- Genetic ---
    {
        id: 'paternity',
        name: 'DNA Paternity Test',
        category: 'Genetic/Molecular',
        description: 'Determines biological fatherhood.',
        preparation: 'Buccal swab or blood.',
        sampleType: 'Swab/Blood',
        turnaroundTime: '5-10 days',
        commonUses: ['Paternity Dispute']
    },

    // --- Special ---
    {
        id: 'semenalysis',
        name: 'Seminal Fluid Analysis (SFA)',
        category: 'Special Tests',
        description: 'Evaluates sperm count, motility, and morphology.',
        preparation: '3-5 days abstinence required.',
        sampleType: 'Semen',
        turnaroundTime: '24 hours',
        commonUses: ['Male Infertility']
    },
    {
        id: 'pap-smear',
        name: 'Pap Smear',
        category: 'Special Tests',
        description: 'Cervical cancer screening.',
        preparation: 'Avoid menstruation days.',
        sampleType: 'Cervical Swab',
        turnaroundTime: '3-5 days',
        commonUses: ['Cervical Cancer Screening']
    }
];

export const DEFAULT_PACKAGES: TestPackage[] = [
    {
        id: 'basic-check',
        name: 'Basic Health Check',
        description: 'Essential screening for common conditions.',
        tests: ['fbc', 'malaria', 'urinalysis'],
        category: 'General',
        icon: '🏥',
        popular: true,
        estimatedPrice: 15000,
        discount: 0
    },
    {
        id: 'exec-check',
        name: 'Executive Wellness',
        description: 'Comprehensive analysis for busy professionals.',
        tests: ['fbc', 'lipid', 'liver-function', 'kidney-function', 'ecg', 'chest-xray'],
        category: 'Premium',
        icon: '💎',
        popular: true,
        estimatedPrice: 65000,
        discount: 10
    },
    {
        id: 'sexual-health',
        name: 'Sexual Health Screen',
        description: 'Confidential screening for STIs.',
        tests: ['hiv', 'syphilis', 'hepatitis-b', 'hepatitis-c'],
        category: 'Specialized',
        icon: '🛡️',
        popular: false,
        estimatedPrice: 20000,
        discount: 0
    },
    {
        id: 'pre-wedding',
        name: 'Pre-Wedding Package',
        description: 'Essential tests for couples planning to marry.',
        tests: ['genotype', 'blood-group', 'hiv', 'hepatitis', 'fertility'],
        category: 'Couple',
        icon: '💍',
        popular: true,
        estimatedPrice: 40000,
        discount: 5
    }
];
