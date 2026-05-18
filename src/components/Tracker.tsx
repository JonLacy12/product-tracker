// @ts-nocheck
import { useState, useRef, useCallback, useEffect } from 'react';

const VENDORS = [
  '4Web',
  'Altus',
  'Amplify',
  'BoneStim',
  'Carlsmed',
  'Cellerate',
  'Choice',
  'Curiteva',
  'Eminent',
  'ISTO',
  'MiMedx',
  'Providence',
  'Royal',
  'SpinalSimplicity',
  'Spinewave',
  'Stimulan',
  'Stryker',
  'Xtant',
  'ZavationCorelink',
];
const NEGA = [
  { p: 'OsteoSelect', i: '309005', d: 'OsteoSelect DBM Putty 0.5cc', f: 47.5 },
  { p: 'OsteoSelect', i: '309010', d: 'OsteoSelect DBM Putty 1.0cc', f: 95 },
  { p: 'OsteoSelect', i: '309025', d: 'OsteoSelect DBM Putty 2.5cc', f: 237.5 },
  { p: 'OsteoSelect', i: '309050', d: 'OsteoSelect DBM Putty 5.0cc', f: 475 },
  { p: 'OsteoSelect', i: '309100', d: 'OsteoSelect DBM Putty 10.0cc', f: 850 },
  { p: 'OsteoSelect', i: '359010', d: 'OsteoSelect DBM Putty 1.0cc Syringe', f: 95 },
  { p: 'OsteoSelect', i: '359025', d: 'OsteoSelect DBM Putty 2.5cc Syringe', f: 237.5 },
  { p: 'OsteoSelect', i: '359050', d: 'OsteoSelect DBM Putty 5.0cc Syringe', f: 475 },
  { p: 'OsteoSelect', i: '359100', d: 'OsteoSelect DBM Putty 10.0cc Syringe', f: 850 },
  { p: 'OsteoSelect Plus', i: '309425', d: 'OsteoSelect Plus DBM Putty 2.5cc', f: 237.5 },
  { p: 'OsteoSelect Plus', i: '309450', d: 'OsteoSelect Plus DBM Putty 5.0cc', f: 475 },
  { p: 'OsteoSelect Plus', i: '309500', d: 'OsteoSelect Plus DBM Putty 10.0cc', f: 850 },
  { p: 'OsteoSelect Plus', i: '359425', d: 'OsteoSelect Plus DBM Putty 2.5cc Syringe', f: 237.5 },
  { p: 'OsteoSelect Plus', i: '359450', d: 'OsteoSelect Plus DBM Putty 5.0cc Syringe', f: 475 },
  { p: 'OsteoSelect Plus', i: '359500', d: 'OsteoSelect Plus DBM Putty 10.0cc Syringe', f: 850 },
  { p: 'OsteoMax', i: '549010', d: 'OsteoMax DBM Putty 1.0cc Syringe', f: 95 },
  { p: 'OsteoMax', i: '549025', d: 'OsteoMax DBM Putty 2.5cc Syringe', f: 237.5 },
  { p: 'OsteoMax', i: '549050', d: 'OsteoMax DBM Putty 5.0cc Syringe', f: 475 },
  { p: 'OsteoMax', i: '549100', d: 'OsteoMax DBM Putty 10.0cc Syringe', f: 850 },
  { p: 'OsteoVive Plus', i: '203201', d: 'OsteoVive Plus 1.0cc', f: 300 },
  { p: 'OsteoVive Plus', i: '203202', d: 'OsteoVive Plus 2.0cc', f: 600 },
  { p: 'OsteoVive Plus', i: '203205', d: 'OsteoVive Plus 5.0cc', f: 1500 },
  { p: 'OsteoVive Plus', i: '203210', d: 'OsteoVive Plus 10.0cc', f: 3000 },
  { p: 'OsteoVive Plus', i: '203215', d: 'OsteoVive Plus 15.0cc', f: 3750 },
  { p: 'OsteoVive Plus', i: '203301', d: 'OsteoVive Plus Jar 1.0cc', f: 300 },
  { p: 'OsteoVive Plus', i: '203302', d: 'OsteoVive Plus Jar 2.0cc', f: 600 },
  { p: 'OsteoVive Plus', i: '203305', d: 'OsteoVive Plus Jar 5.0cc', f: 1500 },
  { p: 'OsteoVive Plus', i: '203310', d: 'OsteoVive Plus Jar 10.0cc', f: 3000 },
  { p: 'OsteoVive Plus', i: '203315', d: 'OsteoVive Plus Jar 15.0cc', f: 3750 },
  { p: 'OsteoFactor Pro', i: '122012', d: 'OsteoFactor Pro 0.5cc', f: 500 },
  { p: 'OsteoFactor Pro', i: '122001', d: 'OsteoFactor Pro 1.0cc', f: 1000 },
  { p: 'OsteoFactor Pro', i: '122025', d: 'OsteoFactor Pro 2.5cc', f: 1350 },
  { p: 'OsteoFactor Pro', i: '122005', d: 'OsteoFactor Pro 5.0cc', f: 2150 },
  { p: 'OsteoFactor Pro', i: '122010', d: 'OsteoFactor Pro 10.0cc', f: 3800 },
  { p: 'SimpliMix', i: '400015', d: 'SimpliMix Graft Delivery Device', f: 400 },
  { p: 'OsteoSponge', i: '109405', d: 'OsteoSponge Filler Fine 0.5cc', f: 47.5 },
  { p: 'OsteoSponge', i: '109210', d: 'OsteoSponge Filler Fine 1.0cc', f: 95 },
  { p: 'OsteoSponge', i: '109225', d: 'OsteoSponge Filler Fine 2.5cc', f: 220 },
  { p: 'OsteoSponge', i: '109250', d: 'OsteoSponge Filler Fine 5.0cc', f: 400 },
  { p: 'OsteoSponge', i: '109310', d: 'OsteoSponge Filler Fine 10.0cc', f: 760 },
  { p: 'OsteoSponge', i: '109315', d: 'OsteoSponge Filler Fine 15.0cc', f: 1080 },
  { p: 'OsteoSponge', i: '109410', d: 'OsteoSponge Filler 1.0cc', f: 95 },
  { p: 'OsteoSponge', i: '109425', d: 'OsteoSponge Filler 2.5cc', f: 220 },
  { p: 'OsteoSponge', i: '109550', d: 'OsteoSponge Filler 5.0cc', f: 400 },
  { p: 'OsteoSponge', i: '109510', d: 'OsteoSponge Filler 10.0cc', f: 760 },
  { p: 'OsteoSponge', i: '109515', d: 'OsteoSponge Filler 15.0cc', f: 1080 },
  { p: 'OsteoSponge', i: '109530', d: 'OsteoSponge Filler 30.0cc', f: 2040 },
  { p: 'OsteoSponge', i: '159550', d: 'OsteoSponge Filler 5.0cc Syringe', f: 400 },
  { p: 'OsteoSponge', i: '109608', d: 'OsteoSponge Block 8mm', f: 190 },
  { p: 'OsteoSponge', i: '109609', d: 'OsteoSponge Block 8mm 10-Pack', f: 1068.75 },
  { p: 'OsteoSponge', i: '109610', d: 'OsteoSponge Block 10mm', f: 304 },
  { p: 'OsteoSponge', i: '109612', d: 'OsteoSponge Block 12mm', f: 369.79 },
  { p: 'OsteoSponge', i: '109614', d: 'OsteoSponge Block 14mm', f: 587.81 },
  { p: 'OsteoSponge', i: '109501', d: 'OsteoSponge Disc 10mm', f: 237.5 },
  { p: 'OsteoSponge', i: '109502', d: 'OsteoSponge Disc 12mm', f: 327.75 },
  { p: 'OsteoSponge', i: '109503', d: 'OsteoSponge Disc 14mm', f: 418 },
  { p: 'OsteoSponge', i: '109621', d: 'OsteoSponge Strip 50x5x5mm', f: 465.5 },
  { p: 'OsteoSponge', i: '109622', d: 'OsteoSponge Strip 50x7x5mm', f: 513 },
  { p: 'OsteoSponge', i: '109631', d: 'OsteoSponge Strip 20x14x5mm', f: 513 },
  { p: 'OsteoSponge', i: '109632', d: 'OsteoSponge Strip 20x14x7mm', f: 712.5 },
  { p: 'OsteoSponge', i: '109633', d: 'OsteoSponge Strip 26x19x7mm', f: 950 },
  { p: 'OsteoSponge', i: '109637', d: 'OsteoSponge Strip 26x19x7mm 2-Pack', f: 1850 },
  { p: 'OsteoSponge', i: '109638', d: 'OsteoSponge Strip 26x19x7mm 4-Pack', f: 3781 },
  { p: 'OsteoSponge', i: '109634', d: 'OsteoSponge Strip 30x10x7mm', f: 741 },
  { p: 'OsteoSponge', i: '109635', d: 'OsteoSponge Strip 50x10x7mm', f: 950 },
  { p: 'OsteoSponge', i: '109636', d: 'OsteoSponge Strip 50x20x7mm', f: 1850 },
  { p: 'OsteoSponge', i: '109640', d: 'OsteoSponge Strip 40x15x5mm', f: 1102 },
  { p: 'OsteoSponge', i: '109642', d: 'OsteoSponge Strip 40x15x2mm', f: 617.5 },
  { p: '3Demin', i: '109762', d: '3Demin Cortical Fibers 2.5cc', f: 233.75 },
  { p: '3Demin', i: '109765', d: '3Demin Cortical Fibers 5.0cc', f: 475 },
  { p: '3Demin', i: '109760', d: '3Demin Cortical Fibers 10.0cc', f: 750 },
  { p: '3Demin', i: '109763', d: '3Demin Cortical Fibers 30.0cc', f: 2450 },
  { p: '3Demin', i: '109776', d: '3Demin Strip 50x10mm Single', f: 817 },
  { p: '3Demin', i: '109775', d: '3Demin Strip 50x10mm 2-Pack', f: 1258.75 },
  { p: '3Demin', i: '109771', d: '3Demin Strip 100x10mm 2-Pack', f: 1495 },
  { p: '3Demin', i: '109772', d: '3Demin Strip 200x10mm 2-Pack', f: 3895 },
  { p: '3Demin', i: '109786', d: '3Demin Boat 50x25mm Single', f: 1258.75 },
  { p: '3Demin', i: '109785', d: '3Demin Boat 50x25mm 2-Pack', f: 1495 },
  { p: '3Demin', i: '109781', d: '3Demin Boat 100x25mm 2-Pack', f: 3277.5 },
  { p: 'Matriform Si', i: '449050', d: 'Matriform Si Strip 50x25x4mm 5.0cc', f: 600 },
  { p: 'Matriform Si', i: '449100', d: 'Matriform Si Strip 100x25x4mm 10.0cc', f: 1200 },
  { p: 'OsteoWrap', i: '109701', d: 'OsteoWrap 10x10mm', f: 72 },
  { p: 'OsteoWrap', i: '109702', d: 'OsteoWrap 15x10mm', f: 131 },
  { p: 'OsteoWrap', i: '109703', d: 'OsteoWrap 15x15mm', f: 149 },
  { p: 'OsteoWrap', i: '109714', d: 'OsteoWrap 70x40mm', f: 2295 },
  { p: 'OsteoWrap', i: '109715', d: 'OsteoWrap 60x50mm', f: 2608 },
  { p: 'OrbitalWrap HD', i: '109733', d: 'OrbitalWrap HD 30x30x2mm', f: 750 },
  { p: 'Atrix-C', i: 'X094-1005', d: 'Atrix-C Cervical Spacer 11x14x5mm', f: 675 },
  { p: 'Atrix-C', i: 'X094-1006', d: 'Atrix-C Cervical Spacer 11x14x6mm', f: 675 },
  { p: 'Atrix-C', i: 'X094-1007', d: 'Atrix-C Cervical Spacer 11x14x7mm', f: 675 },
  { p: 'Atrix-C', i: 'X094-1008', d: 'Atrix-C Cervical Spacer 11x14x8mm', f: 675 },
  { p: 'Atrix-C', i: 'X094-1009', d: 'Atrix-C Cervical Spacer 11x14x9mm', f: 675 },
  { p: 'Atrix-C', i: 'X094-1010', d: 'Atrix-C Cervical Spacer 11x14x10mm', f: 675 },
  { p: 'Atrix-C Union', i: 'X094-3000', d: 'Atrix-C Union 11x14x5mm', f: 675 },
  { p: 'Atrix-C Union', i: 'X094-3001', d: 'Atrix-C Union 11x14x6mm', f: 675 },
  { p: 'Atrix-C Union', i: 'X094-3002', d: 'Atrix-C Union 11x14x7mm', f: 675 },
  { p: 'Atrix-C Union', i: 'X094-3003', d: 'Atrix-C Union 11x14x8mm', f: 675 },
  { p: 'Atrix-C Union', i: 'X094-3004', d: 'Atrix-C Union 11x14x9mm', f: 675 },
  { p: 'Atrix-C Union', i: 'X094-3005', d: 'Atrix-C Union 11x14x10mm', f: 675 },
  { p: 'Atrix-C Union', i: 'X094-3006', d: 'Atrix-C Union 11x14x11mm', f: 675 },
  { p: 'Atrix-C Union', i: 'X094-3007', d: 'Atrix-C Union 11x14x12mm', f: 675 },
  { p: 'Atrix-C Union', i: 'X094-3008', d: 'Atrix-C Union 13x16x5mm', f: 675 },
  { p: 'Atrix-C Union', i: 'X094-3009', d: 'Atrix-C Union 13x16x6mm', f: 675 },
  { p: 'Atrix-C Union', i: 'X094-3010', d: 'Atrix-C Union 13x16x7mm', f: 675 },
  { p: 'Atrix-C Union', i: 'X094-3011', d: 'Atrix-C Union 13x16x8mm', f: 675 },
  { p: 'Atrix-C Union', i: 'X094-3012', d: 'Atrix-C Union 13x16x9mm', f: 675 },
  { p: 'Atrix-C Union', i: 'X094-3013', d: 'Atrix-C Union 13x16x10mm', f: 675 },
  { p: 'Atrix-C Union', i: 'X094-3014', d: 'Atrix-C Union 13x16x11mm', f: 675 },
  { p: 'Atrix-C Union', i: 'X094-3015', d: 'Atrix-C Union 13x16x12mm', f: 675 },
  { p: 'Atrix-C Union', i: 'X094-3016', d: 'Atrix-C Union 15x18x5mm', f: 675 },
  { p: 'Atrix-C Union', i: 'X094-3017', d: 'Atrix-C Union 15x18x6mm', f: 675 },
  { p: 'Atrix-C Union', i: 'X094-3018', d: 'Atrix-C Union 15x18x7mm', f: 675 },
  { p: 'Atrix-C Union', i: 'X094-3019', d: 'Atrix-C Union 15x18x8mm', f: 675 },
  { p: 'Atrix-C Union', i: 'X094-3020', d: 'Atrix-C Union 15x18x9mm', f: 675 },
  { p: 'Atrix-C Union', i: 'X094-3021', d: 'Atrix-C Union 15x18x10mm', f: 675 },
  { p: 'Atrix-C Union', i: 'X094-3022', d: 'Atrix-C Union 15x18x11mm', f: 675 },
  { p: 'Atrix-C Union', i: 'X094-3023', d: 'Atrix-C Union 15x18x12mm', f: 675 },
  { p: 'DBM+BMA Kit', i: '109560MC', d: 'OsteoSponge Filler BMA Kit 60cc', f: 4700 },
  { p: 'DBM+BMA Kit', i: '109636MC', d: 'OsteoSponge Strip 50x20x7mm BMA Kit', f: 2950 },
  { p: 'DBM+BMA Kit', i: '109776MC', d: '3Demin Strip 50x10mm BMA Kit', f: 1767 },
  { p: 'DBM+BMA Kit', i: '109775MC', d: '3Demin Strip 50x10mm 2pk BMA Kit', f: 2150 },
  { p: 'DBM+BMA Kit', i: '109771MC', d: '3Demin Strip 100x10mm 2pk BMA Kit', f: 3250 },
  { p: 'DBM+BMA Kit', i: '109786MC', d: '3Demin Boat 50x25mm BMA Kit', f: 2208 },
  { p: 'DBM+BMA Kit', i: '109785MC', d: '3Demin Boat 50x25mm 2pk BMA Kit', f: 3250 },
  { p: 'DBM+BMA Kit', i: '109781MC', d: '3Demin Boat 100x25mm 2pk BMA Kit', f: 4227 },
  { p: 'H-Graft', i: 'X078-0008', d: 'H-Graft Interspinous 8mm', f: 2875 },
  { p: 'H-Graft', i: 'X078-0010', d: 'H-Graft Interspinous 10mm', f: 2875 },
  { p: 'H-Graft', i: 'X078-0012', d: 'H-Graft Interspinous 12mm', f: 2875 },
  { p: 'H-Graft', i: 'X078-0014', d: 'H-Graft Interspinous 14mm', f: 2875 },
  { p: 'H-Graft', i: 'X078-0016', d: 'H-Graft Interspinous 16mm', f: 2875 },
  { p: 'H-Graft', i: 'X078-0018', d: 'H-Graft Interspinous 18mm', f: 2875 },
  { p: 'H-Graft', i: 'X078-0020', d: 'H-Graft Interspinous 20mm', f: 2875 },
  { p: 'Traditional', i: '103015', d: 'Cancellous Crushed 0.1-4mm 5cc', f: 50 },
  { p: 'Traditional', i: '103115', d: 'Cancellous Crushed 0.1-4mm 15cc', f: 150 },
  { p: 'Traditional', i: '103130', d: 'Cancellous Crushed 0.1-4mm 30cc', f: 300 },
  { p: 'Traditional', i: '103045', d: 'Cancellous Crushed 4-10mm 5cc', f: 50 },
  { p: 'Traditional', i: '103415', d: 'Cancellous Crushed 4-10mm 15cc', f: 150 },
  { p: 'Traditional', i: '103430', d: 'Cancellous Crushed 4-10mm 30cc', f: 300 },
  { p: 'Traditional', i: '101006', d: 'Ilium Tricortical Block 6mm', f: 408 },
  { p: 'Traditional', i: '101007', d: 'Ilium Tricortical Block 7mm', f: 408 },
  { p: 'Traditional', i: '101008', d: 'Ilium Tricortical Block 8mm', f: 408 },
  { p: 'Traditional', i: '101009', d: 'Ilium Tricortical Block 9mm', f: 408 },
  { p: 'Traditional', i: '101010', d: 'Ilium Tricortical Block 10mm', f: 408 },
  { p: 'Traditional', i: '101011', d: 'Ilium Tricortical Block 11mm', f: 408 },
  { p: 'Traditional', i: '101012', d: 'Ilium Tricortical Block 12-14mm', f: 484 },
  { p: 'Traditional', i: '101015', d: 'Ilium Tricortical Block 15mm', f: 528 },
  { p: 'Traditional', i: '101016', d: 'Ilium Tricortical Block 16-21mm', f: 576 },
  { p: 'Traditional', i: '101022', d: 'Ilium Tricortical Block 22-25mm', f: 668 },
  { p: 'Traditional', i: '104205', d: 'Unicortical Block 5mm', f: 500 },
  { p: 'Traditional', i: '104206', d: 'Unicortical Block 6mm', f: 500 },
  { p: 'Traditional', i: '104207', d: 'Unicortical Block 7mm', f: 500 },
  { p: 'Traditional', i: '104208', d: 'Unicortical Block 8mm', f: 500 },
  { p: 'Traditional', i: '104209', d: 'Unicortical Block 9mm', f: 500 },
  { p: 'Traditional', i: '104210', d: 'Unicortical Block 10mm', f: 500 },
  { p: 'Traditional', i: '106040', d: 'Fibula Segment 40-100mm', f: 360 },
  { p: 'Traditional', i: '106101', d: 'Fibula Segment 101-150mm', f: 450 },
  { p: 'Traditional', i: '105300', d: 'Femoral Cortical Strut 200mm Split', f: 850 },
  { p: 'Soft Tissue', i: 'X090-0025-AMN22CM', d: 'Dual Layer Amniotic Membrane 2x2cm', f: 975 },
  { p: 'Soft Tissue', i: 'X090-0025-AMN44CM', d: 'Dual Layer Amniotic Membrane 4x4cm', f: 1672.5 },
  { p: 'Soft Tissue', i: 'X090-0025-AMN46CM', d: 'Dual Layer Amniotic Membrane 4x6cm', f: 2400 },
  { p: 'Soft Tissue', i: 'X090-0025-AMN48CM', d: 'Dual Layer Amniotic Membrane 4x8cm', f: 3000 },
  { p: 'Tendon', i: '208000', d: 'Achilles Tendon w/ Bone Block', f: 925 },
  { p: 'Tendon', i: '208002', d: 'Anterior Tibialis Tendon', f: 925 },
  { p: 'Tendon', i: '208003', d: 'Posterior Tibialis Tendon', f: 925 },
  { p: 'Tendon', i: '208008', d: 'Gracilis Tendon', f: 925 },
  { p: 'Tendon', i: '208011', d: 'Semitendinosus Tendon', f: 925 },
  { p: 'Tendon', i: '208015', d: 'Peroneus', f: 925 },
  { p: 'Tendon', i: '208009', d: 'Hemi-Patella Tendon', f: 925 },
  { p: 'Tendon', i: '208014', d: 'Hemi-Patella Tendon w/ Quad', f: 925 },
  { p: 'Tendon', i: '208012', d: 'Whole Patella Tendon w/ Quad', f: 925 },
  { p: 'Tendon', i: '208013', d: 'Whole Patella Tendon w/o Quad', f: 925 },
];
const NS = [
  { p: 'OsteoSelect', i: '309005', d: 'OsteoSelect DBM Putty 0.5cc', f: 42.5 },
  { p: 'OsteoSelect', i: '309010', d: 'OsteoSelect DBM Putty 1.0cc', f: 85 },
  { p: 'OsteoSelect', i: '309025', d: 'OsteoSelect DBM Putty 2.5cc', f: 212.5 },
  { p: 'OsteoSelect', i: '309050', d: 'OsteoSelect DBM Putty 5.0cc', f: 425 },
  { p: 'OsteoSelect', i: '309100', d: 'OsteoSelect DBM Putty 10.0cc', f: 825 },
  { p: 'OsteoSelect', i: '359010', d: 'OsteoSelect DBM Putty 1.0cc Syringe', f: 85 },
  { p: 'OsteoSelect', i: '359025', d: 'OsteoSelect DBM Putty 2.5cc Syringe', f: 212.5 },
  { p: 'OsteoSelect', i: '359050', d: 'OsteoSelect DBM Putty 5.0cc Syringe', f: 425 },
  { p: 'OsteoSelect', i: '359100', d: 'OsteoSelect DBM Putty 10.0cc Syringe', f: 825 },
  { p: 'OsteoSelect Plus', i: '309425', d: 'OsteoSelect Plus DBM Putty 2.5cc', f: 237.5 },
  { p: 'OsteoSelect Plus', i: '309450', d: 'OsteoSelect Plus DBM Putty 5.0cc', f: 475 },
  { p: 'OsteoSelect Plus', i: '309500', d: 'OsteoSelect Plus DBM Putty 10.0cc', f: 850 },
  { p: 'OsteoSelect Plus', i: '359425', d: 'OsteoSelect Plus DBM Putty 2.5cc Syringe', f: 237.5 },
  { p: 'OsteoSelect Plus', i: '359450', d: 'OsteoSelect Plus DBM Putty 5.0cc Syringe', f: 475 },
  { p: 'OsteoSelect Plus', i: '359500', d: 'OsteoSelect Plus DBM Putty 10.0cc Syringe', f: 850 },
  { p: 'OsteoMax', i: '549010', d: 'OsteoMax DBM Putty 1.0cc Syringe', f: 85 },
  { p: 'OsteoMax', i: '549025', d: 'OsteoMax DBM Putty 2.5cc Syringe', f: 212.5 },
  { p: 'OsteoMax', i: '549050', d: 'OsteoMax DBM Putty 5.0cc Syringe', f: 425 },
  { p: 'OsteoMax', i: '549100', d: 'OsteoMax DBM Putty 10.0cc Syringe', f: 850 },
  { p: 'BiomaX', i: 'BMX-0001', d: 'BiomaX Bone Graft Putty 1cc', f: 85 },
  { p: 'BiomaX', i: 'BMX-0002', d: 'BiomaX Bone Graft Putty 2.5cc', f: 212.5 },
  { p: 'BiomaX', i: 'BMX-0005', d: 'BiomaX Bone Graft Putty 5cc', f: 425 },
  { p: 'BiomaX', i: 'BMX-0010', d: 'BiomaX Bone Graft Putty 10cc', f: 850 },
  { p: 'BiomaX Plus Chips', i: 'BMX-0105', d: 'BiomaX Putty Plus Chips 5cc', f: 475 },
  { p: 'BiomaX Plus Chips', i: 'BMX-0110', d: 'BiomaX Putty Plus Chips 10cc', f: 850 },
  { p: 'OsteoVive Plus', i: '203201', d: 'OsteoVive Plus 1.0cc Syringe', f: 275 },
  { p: 'OsteoVive Plus', i: '203225', d: 'OsteoVive Plus 2.5cc Syringe', f: 687.5 },
  { p: 'OsteoVive Plus', i: '203205', d: 'OsteoVive Plus 5.0cc Syringe', f: 1375 },
  { p: 'OsteoVive Plus', i: '203210', d: 'OsteoVive Plus 10.0cc Syringe', f: 2750 },
  { p: 'OsteoVive Plus', i: '203215', d: 'OsteoVive Plus 15.0cc Syringe', f: 4125 },
  { p: 'OsteoVive Plus', i: '203301', d: 'OsteoVive Plus 1.0cc Jar', f: 275 },
  { p: 'OsteoVive Plus', i: '203325', d: 'OsteoVive Plus 2.5cc Jar', f: 687.5 },
  { p: 'OsteoVive Plus', i: '203305', d: 'OsteoVive Plus 5.0cc Jar', f: 1375 },
  { p: 'OsteoVive Plus', i: '203310', d: 'OsteoVive Plus 10.0cc Jar', f: 2750 },
  { p: 'OsteoVive Plus', i: '203315', d: 'OsteoVive Plus 15.0cc Jar', f: 4125 },
  { p: 'OsteoFactor Pro', i: '122012', d: 'OsteoFactor Pro 0.5cc', f: 225 },
  { p: 'OsteoFactor Pro', i: '122001', d: 'OsteoFactor Pro 1.0cc', f: 450 },
  { p: 'OsteoFactor Pro', i: '122025', d: 'OsteoFactor Pro 2.5cc', f: 1050 },
  { p: 'OsteoFactor Pro', i: '122005', d: 'OsteoFactor Pro 5.0cc', f: 1850 },
  { p: 'OsteoFactor Pro', i: '122010', d: 'OsteoFactor Pro 10.0cc', f: 2995 },
  { p: 'OsteoSponge', i: '109405', d: 'OsteoSponge Filler Fine 0.5cc', f: 45 },
  { p: 'OsteoSponge', i: '109210', d: 'OsteoSponge Filler Fine 1.0cc', f: 75 },
  { p: 'OsteoSponge', i: '109225', d: 'OsteoSponge Filler Fine 2.5cc', f: 125 },
  { p: 'OsteoSponge', i: '109250', d: 'OsteoSponge Filler Fine 5.0cc', f: 350 },
  { p: 'OsteoSponge', i: '109310', d: 'OsteoSponge Filler Fine 10.0cc', f: 650 },
  { p: 'OsteoSponge', i: '109315', d: 'OsteoSponge Filler Fine 15.0cc', f: 750 },
  { p: 'OsteoSponge', i: '109410', d: 'OsteoSponge Filler 1.0cc', f: 75 },
  { p: 'OsteoSponge', i: '109425', d: 'OsteoSponge Filler 2.5cc', f: 125 },
  { p: 'OsteoSponge', i: '109550', d: 'OsteoSponge Filler 5.0cc', f: 350 },
  { p: 'OsteoSponge', i: '109510', d: 'OsteoSponge Filler 10.0cc', f: 650 },
  { p: 'OsteoSponge', i: '109515', d: 'OsteoSponge Filler 15.0cc', f: 750 },
  { p: 'OsteoSponge', i: '109530', d: 'OsteoSponge Filler 30.0cc', f: 1825 },
  { p: 'OsteoSponge', i: '109608', d: 'OsteoSponge Block 8mm', f: 195 },
  { p: 'OsteoSponge', i: '109610', d: 'OsteoSponge Block 10mm', f: 300 },
  { p: 'OsteoSponge', i: '109612', d: 'OsteoSponge Block 12mm', f: 375 },
  { p: 'OsteoSponge', i: '109614', d: 'OsteoSponge Block 14mm', f: 305 },
  { p: 'OsteoSponge', i: '109501', d: 'OsteoSponge Disc 10mm', f: 225 },
  { p: 'OsteoSponge', i: '109502', d: 'OsteoSponge Disc 12mm', f: 330 },
  { p: 'OsteoSponge', i: '109503', d: 'OsteoSponge Disc 14mm', f: 425 },
  { p: 'OsteoSponge', i: '109621', d: 'OsteoSponge Strip 50x5x5mm', f: 475 },
  { p: 'OsteoSponge', i: '109622', d: 'OsteoSponge Strip 50x7x5mm', f: 525 },
  { p: 'OsteoSponge', i: '109631', d: 'OsteoSponge Strip 20x14x5mm', f: 515 },
  { p: 'OsteoSponge', i: '109632', d: 'OsteoSponge Strip 20x14x7mm', f: 700 },
  { p: 'OsteoSponge', i: '109633', d: 'OsteoSponge Strip 26x19x7mm', f: 950 },
  { p: 'OsteoSponge', i: '109637', d: 'OsteoSponge Strip 26x19x7mm 2-Pack', f: 1750 },
  { p: 'OsteoSponge', i: '109638', d: 'OsteoSponge Strip 26x19x7mm 4-Pack', f: 3500 },
  { p: 'OsteoSponge', i: '109634', d: 'OsteoSponge Strip 30x10x7mm', f: 775 },
  { p: 'OsteoSponge', i: '109635', d: 'OsteoSponge Strip 50x10x7mm', f: 950 },
  { p: 'OsteoSponge', i: '109636', d: 'OsteoSponge Strip 50x20x7mm', f: 1895 },
  { p: 'OsteoSponge', i: '109640', d: 'OsteoSponge Strip 40x15x5mm', f: 1100 },
  { p: 'OsteoSponge', i: '109642', d: 'OsteoSponge Strip 40x15x2mm', f: 630 },
  { p: 'FibreX', i: 'FBX-0001', d: 'FibreX Bone Fibers 1cc', f: 85 },
  { p: 'FibreX', i: 'FBX-0005', d: 'FibreX Bone Fibers 5cc', f: 425 },
  { p: 'FibreX', i: 'FBX-0010', d: 'FibreX Bone Fibers 10cc', f: 850 },
  { p: '3Demin', i: '109762', d: '3Demin Cortical Fibers 2.5cc', f: 215 },
  { p: '3Demin', i: '109765', d: '3Demin Cortical Fibers 5.0cc', f: 450 },
  { p: '3Demin', i: '109760', d: '3Demin Cortical Fibers 10.0cc', f: 750 },
  { p: '3Demin', i: '109763', d: '3Demin Cortical Fibers 30.0cc', f: 2250 },
  { p: '3Demin', i: '109776', d: '3Demin Strip 50x10mm Single', f: 800 },
  { p: '3Demin', i: '109775', d: '3Demin Strip 50x10mm 2-Pack', f: 1200 },
  { p: '3Demin', i: '109771', d: '3Demin Strip 100x10mm 2-Pack', f: 2325 },
  { p: '3Demin', i: '109772', d: '3Demin Strip 200x10mm 2-Pack', f: 3500 },
  { p: '3Demin', i: '109786', d: '3Demin Boat 50x25mm Single', f: 1200 },
  { p: '3Demin', i: '109785', d: '3Demin Boat 50x25mm 2-Pack', f: 2325 },
  { p: '3Demin', i: '109781', d: '3Demin Boat 100x25mm 2-Pack', f: 3200 },
  { p: 'BioAdapt DBM', i: 'DU0025', d: 'BioAdapt DBM Foam Medium 50x25x5mm 6cc', f: 1075 },
  { p: 'BioAdapt DBM', i: 'DU0125', d: 'BioAdapt DBM Foam Large 100x25x5mm 12cc', f: 1579 },
  { p: 'BioAdapt DBM', i: 'DU0110', d: 'BioAdapt DBM Foam Skinny 100x10x8mm 2ea 16cc', f: 1920 },
  { p: 'BioAdapt Bridge', i: 'DS0242', d: 'BioAdapt Bridge 24cc', f: 2475 },
  { p: 'BioAdapt Bridge', i: 'DS0462', d: 'BioAdapt Bridge 46cc', f: 3300 },
  { p: 'SimpliMix', i: '400015', d: 'SimpliMix Graft Delivery Device', f: 685 },
  { p: 'DBM+BMA Kit', i: '109636MC', d: 'OsteoSponge Strip 50x20x7mm BMA Kit', f: 2845 },
  { p: 'DBM+BMA Kit', i: '109776MC', d: '3Demin Strip 50x10mm BMA Kit', f: 1550 },
  { p: 'DBM+BMA Kit', i: '109775MC', d: '3Demin Strip 50x10mm 2pk BMA Kit', f: 1950 },
  { p: 'DBM+BMA Kit', i: '109771MC', d: '3Demin Strip 100x10mm 2pk BMA Kit', f: 2245 },
  { p: 'DBM+BMA Kit', i: '109786MC', d: '3Demin Boat 50x25mm BMA Kit', f: 1950 },
  { p: 'DBM+BMA Kit', i: '109785MC', d: '3Demin Boat 50x25mm 2pk BMA Kit', f: 2245 },
  { p: 'DBM+BMA Kit', i: '109781MC', d: '3Demin Boat 100x25mm 2pk BMA Kit', f: 3950 },
  { p: 'Matriform Si', i: '449050', d: 'Matriform Si Strip 50x25x4mm 5.0cc', f: 350 },
  { p: 'Matriform Si', i: '449100', d: 'Matriform Si Strip 100x25x4mm 10.0cc', f: 700 },
  { p: 'nanOss', i: '90-100-01', d: 'nanOss Bone Void Filler 1cc', f: 70 },
  { p: 'nanOss', i: '90-100-02', d: 'nanOss Bone Void Filler 2cc', f: 140 },
  { p: 'nanOss', i: '90-100-05', d: 'nanOss Bone Void Filler 5cc', f: 350 },
  { p: 'nanOss', i: '90-100-10', d: 'nanOss Bone Void Filler 10cc', f: 700 },
  { p: 'nanOss', i: '90-100-20', d: 'nanOss Bone Void Filler 20cc', f: 1400 },
  { p: 'nanOss', i: '90-200-05K', d: 'nanOss Loaded Kit 5cc', f: 350 },
  { p: 'nanOss', i: '90-200-10K', d: 'nanOss Loaded Kit 10cc', f: 700 },
  { p: 'nanOss 3D', i: '90-300-25504', d: 'nanOss 3D 5cc 25x50x4', f: 350 },
  { p: 'nanOss 3D', i: '90-300-251004', d: 'nanOss 3D 10cc 25x100x4', f: 700 },
  { p: 'nanOss 3D', i: '90-300-25508', d: 'nanOss 3D 10cc 25x50x8', f: 700 },
  { p: 'nanOss 3D', i: '90-300-251008', d: 'nanOss 3D 20cc 25x100x8', f: 1400 },
  { p: 'nanOss 3D Plus', i: '90-400-25504', d: 'nanOss 3D Plus 5cc 25x50x4', f: 350 },
  { p: 'nanOss 3D Plus', i: '90-400-251004', d: 'nanOss 3D Plus 10cc 25x100x4', f: 700 },
  { p: 'nanOss 3D Plus', i: '90-400-25508', d: 'nanOss 3D Plus 10cc 25x50x8', f: 700 },
  { p: 'nanOss 3D Plus', i: '90-400-251008', d: 'nanOss 3D Plus 20cc 25x100x8', f: 1400 },
  { p: 'OsteoWrap', i: '109701', d: 'OsteoWrap 10x10mm', f: 72 },
  { p: 'OsteoWrap', i: '109702', d: 'OsteoWrap 15x10mm', f: 131 },
  { p: 'OsteoWrap', i: '109703', d: 'OsteoWrap 15x15mm', f: 149 },
  { p: 'OsteoWrap', i: '109714', d: 'OsteoWrap 70x40mm', f: 1731.9 },
  { p: 'OsteoWrap', i: '109715', d: 'OsteoWrap 60x50mm', f: 1960.92 },
  { p: 'OrbitalWrap HD', i: '109733', d: 'OrbitalWrap HD 30x30x2mm', f: 750 },
  { p: 'Atrix-C', i: 'X094-1005', d: 'Atrix-C Cervical Spacer 11x14x5mm', f: 850 },
  { p: 'Atrix-C', i: 'X094-1006', d: 'Atrix-C Cervical Spacer 11x14x6mm', f: 850 },
  { p: 'Atrix-C', i: 'X094-1007', d: 'Atrix-C Cervical Spacer 11x14x7mm', f: 850 },
  { p: 'Atrix-C', i: 'X094-1008', d: 'Atrix-C Cervical Spacer 11x14x8mm', f: 850 },
  { p: 'Atrix-C', i: 'X094-1009', d: 'Atrix-C Cervical Spacer 11x14x9mm', f: 850 },
  { p: 'Atrix-C', i: 'X094-1010', d: 'Atrix-C Cervical Spacer 11x14x10mm', f: 850 },
  { p: 'Atrix-C Union', i: 'X094-3000', d: 'Atrix-C Union 11x14x5mm', f: 850 },
  { p: 'Atrix-C Union', i: 'X094-3001', d: 'Atrix-C Union 11x14x6mm', f: 850 },
  { p: 'Atrix-C Union', i: 'X094-3002', d: 'Atrix-C Union 11x14x7mm', f: 850 },
  { p: 'Atrix-C Union', i: 'X094-3003', d: 'Atrix-C Union 11x14x8mm', f: 850 },
  { p: 'Atrix-C Union', i: 'X094-3004', d: 'Atrix-C Union 11x14x9mm', f: 850 },
  { p: 'Atrix-C Union', i: 'X094-3005', d: 'Atrix-C Union 11x14x10mm', f: 850 },
  { p: 'Atrix-C Union', i: 'X094-3006', d: 'Atrix-C Union 11x14x11mm', f: 850 },
  { p: 'Atrix-C Union', i: 'X094-3007', d: 'Atrix-C Union 11x14x12mm', f: 850 },
  { p: 'Atrix-C Union', i: 'X094-3008', d: 'Atrix-C Union 13x16x5mm', f: 850 },
  { p: 'Atrix-C Union', i: 'X094-3009', d: 'Atrix-C Union 13x16x6mm', f: 850 },
  { p: 'Atrix-C Union', i: 'X094-3010', d: 'Atrix-C Union 13x16x7mm', f: 850 },
  { p: 'Atrix-C Union', i: 'X094-3011', d: 'Atrix-C Union 13x16x8mm', f: 850 },
  { p: 'Atrix-C Union', i: 'X094-3012', d: 'Atrix-C Union 13x16x9mm', f: 850 },
  { p: 'Atrix-C Union', i: 'X094-3013', d: 'Atrix-C Union 13x16x10mm', f: 850 },
  { p: 'Atrix-C Union', i: 'X094-3014', d: 'Atrix-C Union 13x16x11mm', f: 850 },
  { p: 'Atrix-C Union', i: 'X094-3015', d: 'Atrix-C Union 13x16x12mm', f: 850 },
  { p: 'H-Graft', i: 'X078-0008', d: 'H-Graft Interspinous 8mm', f: 2750 },
  { p: 'H-Graft', i: 'X078-0010', d: 'H-Graft Interspinous 10mm', f: 2750 },
  { p: 'H-Graft', i: 'X078-0012', d: 'H-Graft Interspinous 12mm', f: 2750 },
  { p: 'H-Graft', i: 'X078-0014', d: 'H-Graft Interspinous 14mm', f: 2750 },
  { p: 'H-Graft', i: 'X078-0016', d: 'H-Graft Interspinous 16mm', f: 2750 },
  { p: 'H-Graft', i: 'X078-0018', d: 'H-Graft Interspinous 18mm', f: 2750 },
  { p: 'H-Graft', i: 'X078-0020', d: 'H-Graft Interspinous 20mm', f: 2750 },
  { p: 'Traditional', i: '103015', d: 'Cancellous Crushed 0.1-4mm 5cc', f: 60 },
  { p: 'Traditional', i: '103115', d: 'Cancellous Crushed 0.1-4mm 15cc', f: 180 },
  { p: 'Traditional', i: '103130', d: 'Cancellous Crushed 0.1-4mm 30cc', f: 360 },
  { p: 'Traditional', i: '103045', d: 'Cancellous Crushed 4-10mm 5cc', f: 60 },
  { p: 'Traditional', i: '103415', d: 'Cancellous Crushed 4-10mm 15cc', f: 180 },
  { p: 'Traditional', i: '103430', d: 'Cancellous Crushed 4-10mm 30cc', f: 360 },
  { p: 'Traditional', i: '101006', d: 'Ilium Tricortical Block 6mm', f: 408 },
  { p: 'Traditional', i: '101007', d: 'Ilium Tricortical Block 7mm', f: 408 },
  { p: 'Traditional', i: '101008', d: 'Ilium Tricortical Block 8mm', f: 408 },
  { p: 'Traditional', i: '101009', d: 'Ilium Tricortical Block 9mm', f: 408 },
  { p: 'Traditional', i: '101010', d: 'Ilium Tricortical Block 10mm', f: 408 },
  { p: 'Traditional', i: '101011', d: 'Ilium Tricortical Block 11mm', f: 408 },
  { p: 'Traditional', i: '101012', d: 'Ilium Tricortical Block 12-14mm', f: 484 },
  { p: 'Traditional', i: '101015', d: 'Ilium Tricortical Block 15mm', f: 528 },
  { p: 'Traditional', i: '101016', d: 'Ilium Tricortical Block 16-21mm', f: 576 },
  { p: 'Traditional', i: '101022', d: 'Ilium Tricortical Block 22-25mm', f: 668 },
  { p: 'Traditional', i: '104205', d: 'Unicortical Block 5mm', f: 480 },
  { p: 'Traditional', i: '104206', d: 'Unicortical Block 6mm', f: 480 },
  { p: 'Traditional', i: '104207', d: 'Unicortical Block 7mm', f: 480 },
  { p: 'Traditional', i: '104208', d: 'Unicortical Block 8mm', f: 480 },
  { p: 'Traditional', i: '104209', d: 'Unicortical Block 9mm', f: 480 },
  { p: 'Traditional', i: '104210', d: 'Unicortical Block 10mm', f: 480 },
  { p: 'Traditional', i: '106040', d: 'Fibula Segment 40-100mm', f: 360 },
  { p: 'Traditional', i: '106101', d: 'Fibula Segment 101-150mm', f: 450 },
  { p: 'Traditional', i: '105300', d: 'Femoral Cortical Strut 200mm Split', f: 850 },
];
const ISTO_NS = [
  { g: 'InQu', i: 'IQSP-PP-110', d: 'InQu Paste Mix Plus 10cc', f: 1750 },
  { g: 'OsseoGEN', i: '20100010', d: 'OsseoGEN cellular bone matrix 1cc', f: 360 },
  { g: 'OsseoGEN', i: '20100020', d: 'OsseoGEN cellular bone matrix 2cc', f: 675 },
  { g: 'OsseoGEN', i: '20100050', d: 'OsseoGEN cellular bone matrix 5cc', f: 1640 },
  { g: 'OsseoGEN', i: '20100100', d: 'OsseoGEN cellular bone matrix 10cc', f: 3350 },
  { g: 'OsseoGEN', i: '20100150', d: 'OsseoGEN cellular bone matrix 15cc', f: 4800 },
  { g: 'Fibrant Anchors', i: 'IFLX-FA-5560', d: 'Fibrant Anchor, Fits 5.5/6.0 Screw', f: 1535 },
  { g: 'Fibrant Anchors', i: 'IFLX-FA-6570', d: 'Fibrant Anchor, Fits 6.5/7.0 Screw', f: 1535 },
  { g: 'Fibrant Anchors', i: 'IFLX-FA-7580', d: 'Fibrant Anchor, Fits 7.5/8.0 Screw', f: 1535 },
  { g: 'Fibrant Anchors', i: 'IFLX-FA-8590', d: 'Fibrant Anchor, Fits 8.5/9.0 Screw', f: 1535 },
  { g: 'Fibrant Paks', i: 'IFLX-FBG-SM', d: 'Fibrant Pak 1-Level (5cm)', f: 2050 },
  { g: 'Fibrant Paks', i: 'IFLX-FBG-SM-DC', d: 'Fibrant Pak 1-Level Dual + 5cc chips', f: 3421 },
  { g: 'Fibrant Paks', i: 'IFLX-FBG-LG', d: 'Fibrant Pak 2-Level (10cm)', f: 3700 },
  { g: 'Fibrant Paks', i: 'IFLX-FBG-LG-DC', d: 'Fibrant Pak 2-Level Dual + 15cc chips', f: 6693 },
  { g: 'ProteiOS', i: '60100010', d: 'ProteiOS growth factor small', f: 1185 },
  { g: 'ProteiOS', i: '60100025', d: 'ProteiOS growth factor medium', f: 1650 },
  { g: 'ProteiOS', i: '60100050', d: 'ProteiOS growth factor large', f: 2400 },
  { g: 'ProteiOS', i: '60100100', d: 'ProteiOS growth factor x-large', f: 3160 },
  { g: 'Fibrant Bullets', i: 'IFLX-FBL-0605', d: 'Fibrant Bullet 5 Pack 6mm', f: 1650 },
  { g: 'Fibrant Bullets', i: 'IFLX-FBL-0610', d: 'Fibrant Bullet 10 Pack 6mm', f: 2700 },
];
const SW_NS = [
  // Tornado Bioactive Bone Graft Matrix
  {
    g: 'Tornado™ Bone Graft',
    i: '11-5805',
    d: 'Bioactive Bone Graft Matrix, 5cc Moldable Strip',
    f: 875,
  },
  {
    g: 'Tornado™ Bone Graft',
    i: '11-5800',
    d: 'Bioactive Bone Graft Matrix, 10cc Moldable Strip',
    f: 1750,
  },
  {
    g: 'Tornado™ Bone Graft',
    i: '11-5801',
    d: 'Bioactive Bone Graft Matrix, 20cc Moldable Strip',
    f: 3500,
  },
  {
    g: 'Tornado™ Bone Graft',
    i: '11-5802',
    d: 'Bioactive Bone Graft Matrix, 40cc Moldable Strip',
    f: 7000,
  },
  {
    g: 'Tornado™ Bone Graft',
    i: '11-5803',
    d: 'Bioactive Bone Graft Matrix, 7cc Moldable Puck',
    f: 1225,
  },
  {
    g: 'Tornado™ Bone Graft',
    i: '11-5804',
    d: 'Bioactive Bone Graft Matrix, 14cc Moldable Puck',
    f: 2450,
  },
  // TRUE POSITION Spacers (all $4,300)
  {
    g: 'TRUE POSITION® Spacers',
    i: '11-6101 to 11-6137',
    d: 'Lordotic Spacer 27-36mm x 9-15mm (37 sizes)',
    f: 4300,
  },
  {
    g: 'TRUE POSITION® Spacers',
    i: '11-6100/6110/6130',
    d: 'Non-Lordotic Spacer 27-36mm x 7.5mm (3 sizes)',
    f: 4300,
  },
  // Stronghold 3D Ti Pivoting Interbody (all $4,300)
  {
    g: 'Stronghold™ 3D Pivoting',
    i: 'SW-19106-3008 to 3016',
    d: 'TLIF Ti Cage PIV - CVD Lord (L)30 x (H)8-16mm (9 sizes)',
    f: 4300,
  },
  // Stronghold 3D Ti Interbody (all $4,000)
  {
    g: 'Stronghold™ 3D Interbody',
    i: 'SW-19109-xxxx',
    d: 'Lumbar Ti Cage Convex (W)9.5 x (L)22-30 x (H)7-14mm (many sizes)',
    f: 4000,
  },
  {
    g: 'Stronghold™ 3D Interbody',
    i: 'SW-19169-xxxx',
    d: 'Lumbar Ti Cage Lordotic 6" (W)9.5 x various (many sizes)',
    f: 4000,
  },
  {
    g: 'Stronghold™ 3D Interbody',
    i: 'SW-19159-xxxx',
    d: 'Lumbar Ti Cage Lordotic 15" (W)9.5 x various (many sizes)',
    f: 4000,
  },
  // Leva Interbody Device (all $4,500)
  {
    g: 'Leva™ Interbody',
    i: '11-7307 to 11-7314',
    d: 'Leva 7-14mm 22 (L) x10 (W) x7 (H) PF',
    f: 4500,
  },
  { g: 'Leva™ Interbody', i: '11-7107 to 11-7114', d: 'Leva 7-14mm 25 (L) x10 (W) PF', f: 4500 },
  { g: 'Leva™ Interbody', i: '11-7210 to 11-7214', d: 'Leva 10-14mm 22 (L) PX', f: 4500 },
  { g: 'Leva™ Interbody', i: '11-7010 to 11-7015', d: 'Leva 10-15mm 25 (L) PX', f: 4500 },
  { g: 'Leva™ Interbody', i: '11-7222/7223/7224', d: 'Leva Lordotic 12-14mm PX', f: 4500 },
  // Leva AF ALIF Stand-Alone
  {
    g: 'Leva™ AF ALIF',
    i: '11-0611 to 11-0624',
    d: 'AF Spacer 26 (W) x 26 (L), 8° Lordotic (14 sizes)',
    f: 6800,
  },
  {
    g: 'Leva™ AF ALIF',
    i: '11-0111 to 11-0124',
    d: 'AF Spacer 30 (W) x 26 (L), 8° Lordotic (14 sizes)',
    f: 6800,
  },
  {
    g: 'Leva™ AF ALIF',
    i: '11-0209 to 11-0222',
    d: 'AF Spacer 34 (W) x 28 (L), 8° Lordotic (14 sizes)',
    f: 6800,
  },
  {
    g: 'Leva™ AF ALIF',
    i: '11-0224 to 11-0237',
    d: 'AF Spacer 38 (W) x 28 (L), 8° Lordotic (14 sizes)',
    f: 6800,
  },
  { g: 'Leva™ AF ALIF', i: '11-0863 to 11-0867', d: 'AF Plate 26/30 (W) x 9-17 (H) mm', f: 2000 },
  { g: 'Leva™ AF ALIF', i: '11-0803 to 11-0809', d: 'AF Plate 34 (W) x 9-21 (H) mm', f: 2000 },
  { g: 'Leva™ AF ALIF', i: '11-0843 to 11-0849', d: 'AF Plate 38 (W) x 9-21 (H) mm', f: 2000 },
  { g: 'Leva™ AF ALIF', i: '11-0025.1', d: 'AF Screw 5.0 x 25mm (each)', f: 450 },
  { g: 'Leva™ AF ALIF', i: '11-0025.3', d: 'AF Screw 5.0 x 25mm (3 pack)', f: 1350 },
  { g: 'Leva™ AF ALIF', i: '11-0030.1', d: 'AF Screw 5.0 x 30mm (each)', f: 450 },
  { g: 'Leva™ AF ALIF', i: '11-0035.1', d: 'AF Screw 5.0 x 35mm (each)', f: 450 },
  // StaXs XD Expandable (all $4,500)
  {
    g: 'StaXs® XD Expandable',
    i: '11-1522/1525/1529',
    d: 'Low Profile Convex 22-29 x 9 x 7, with Ta markers',
    f: 4500,
  },
  {
    g: 'StaXs® XD Expandable',
    i: '11-1550/1551',
    d: 'Lordotic Expandable 22-25 x 9 x 7x8 Deg',
    f: 4500,
  },
  {
    g: 'StaXs® XD Expandable',
    i: '11-1750/1751',
    d: 'Lordotic Expandable 22-25 x 9 x 7 x 15 Deg',
    f: 4500,
  },
  { g: 'StaXs® XD Expandable', i: '11-1175/1179', d: 'Convex 25-29 x 11 x 7', f: 4500 },
  // StaXs XD with Titanium Coating (all $4,500)
  { g: 'StaXs® XD Ti Coating', i: '11-1580/1581', d: 'Low Profile Convex w/ Ti Coating', f: 4500 },
  { g: 'StaXs® XD Ti Coating', i: '11-1590/1591', d: 'Lordotic Expandable w/ Ti Coating', f: 4500 },
  {
    g: 'StaXs® XD Ti Coating',
    i: '11-1666/1669',
    d: 'Lordotic 22-25 x 9 x 7 x 15 Deg w/ Ti Coating',
    f: 4500,
  },
  // Velocity (all $4,500)
  {
    g: 'Velocity™',
    i: '11-2500/2501',
    d: 'Biconvex Expandable Cartridge 22(L) x 10mm (W) x 7 (H)',
    f: 4500,
  },
  {
    g: 'Velocity™',
    i: '11-2617/2618',
    d: 'Lordotic Expandable Cartridge 22/25 (L) x 10mm x 7 (H) x 8°',
    f: 4500,
  },
  { g: 'Velocity™', i: '11-2530/2531', d: 'Biconvex 22(L) x 10mm x 8 (H)', f: 4500 },
  { g: 'Velocity™', i: '11-2644/2645', d: 'Lordotic 22/25 (L) x 10mm x 8 (H) x 8°', f: 4500 },
  // Exceed Interbody (all $4,500)
  {
    g: 'Exceed™ Interbody',
    i: '11-5331 to 11-5336',
    d: 'Exceed 25mm (L) x 10mm (W) x 9-14mm (H), 0° Lordotic',
    f: 4500,
  },
  {
    g: 'Exceed™ Interbody',
    i: '11-5339 to 11-5344',
    d: 'Exceed 22mm (L) x 10mm (W) x 9-14mm (H), 0° Lordotic',
    f: 4500,
  },
  {
    g: 'Exceed™ Interbody',
    i: '11-5348 to 11-5351',
    d: 'Exceed 25mm (L) x 10mm (W) x 10-13mm (H), 8° Lordotic',
    f: 4500,
  },
  {
    g: 'Exceed™ Interbody',
    i: '11-5430/5354/5355',
    d: 'Exceed 22mm (L) x 10mm (W), 8° Lordotic',
    f: 4500,
  },
  {
    g: 'Exceed™ Interbody',
    i: '11-5356/5357/5412 to 5435',
    d: 'Exceed 22-25mm, 8°/15° Lordotic (more sizes)',
    f: 4500,
  },
  // Additional Products
  { g: 'Additional Products', i: '10-7500', d: 'GraftMag Graft Delivery System Kit', f: 1850 },
  {
    g: 'Additional Products',
    i: '10-7515',
    d: 'GraftMag Graft Delivery System Kit, Mini',
    f: 1850,
  },
  {
    g: 'Additional Products',
    i: '10-7522',
    d: 'GraftMag Graft Delivery System Disposable Kit, EX',
    f: 1850,
  },
  {
    g: 'Additional Products',
    i: '10-1530',
    d: 'Disposable Access Kit (Sterile Dilator Set)',
    f: 3282.75,
  },
  {
    g: 'Additional Products',
    i: '10-1525',
    d: 'Disposable Dilator Set (Sterile Dilators 8, 13, 18mm)',
    f: 2360.25,
  },
  { g: 'Additional Products', i: 'RLSP400', d: 'Monopolar Probe', f: 500 },
  {
    g: 'Additional Products',
    i: 'RLSP494',
    d: 'Monopolar Probe, integrated handle, sterile',
    f: 500,
  },
  { g: 'Additional Products', i: 'RLSP210-04', d: 'Monopolar Stim Probe, 3mm', f: 500 },
  { g: 'Additional Products', i: '10-1427', d: 'K-Wire, Blunt', f: 357.75 },
  { g: 'Additional Products', i: '10-2352', d: 'K-Wire, Diamond Tip', f: 357.75 },
  {
    g: 'Additional Products',
    i: 'ML-0301/100',
    d: 'Non-Sterile, Stainless Steel K-Wire',
    f: 357.75,
  },
  { g: 'Additional Products', i: 'DBBN-11-15.1', d: 'OSTEO-SITE Bone Biopsy Needle', f: 150 },
  { g: 'Additional Products', i: '10-4032', d: 'Radel Tubular Retractor, 16mm', f: 515.25 },
  {
    g: 'Additional Products',
    i: '10-4111/4113/4115/4117',
    d: 'Cannulated Tap 4.5-7.5mm',
    f: 515.25,
  },
  // CapSure PS3 Spine System
  {
    g: 'CapSure™ PS3',
    i: '11-3421 to 11-3960',
    d: 'Polyaxial Double Lead Screw 4.5-10.5mm (all sizes)',
    f: 1003.2,
  },
  {
    g: 'CapSure™ PS3',
    i: '11-3030 to 11-3301',
    d: 'Curved/Straight Rod 5.5mm (all lengths)',
    f: 300,
  },
  { g: 'CapSure™ PS3', i: '11-3000', d: 'PS3 Set Screw / Locking Screw', f: 156 },
  { g: 'CapSure™ PS3', i: '11-3020/3021/3022', d: 'Low Profile Cross Connector S/M/L', f: 680 },
  { g: 'CapSure™ PS3', i: '10-3146/3156/3166/3176', d: 'CapSure PS3 Tap 4.5-7.5mm', f: 515.25 },
  // CapSure PS3 Complex Spine
  {
    g: 'CapSure™ PS3 Complex',
    i: '11-3770 to 11-3912',
    d: 'Iliac Screw Polyaxial Double-Lead 7.5-10.5mm',
    f: 1003.2,
  },
  { g: 'CapSure™ PS3 Complex', i: '11-3358/3360', d: 'Double-Lead 10.5x70/80mm', f: 1003.2 },
  { g: 'CapSure™ PS3 Complex', i: '11-3362 to 11-3366', d: 'Double-Lead 10.5x90-120mm', f: 1003.2 },
  { g: 'CapSure™ PS3 Complex', i: '11-3160', d: 'CapSure Connector Locking Screw', f: 156 },
  {
    g: 'CapSure™ PS3 Complex',
    i: '11-3178/3182/3184',
    d: 'Rod Straight Hex End Ti 200-500mm',
    f: 300,
  },
  {
    g: 'CapSure™ PS3 Complex',
    i: '11-3169/3173/3175',
    d: 'Rod Straight Hex End CoCr 200-500mm',
    f: 342,
  },
  {
    g: 'CapSure™ PS3 Complex',
    i: '11-3164 to 11-3166',
    d: 'Offset Connector Open 20-40mm',
    f: 680,
  },
  {
    g: 'CapSure™ PS3 Complex',
    i: '11-3153 to 11-3155',
    d: 'Offset Connector Closed 20-40mm',
    f: 680,
  },
  { g: 'CapSure™ PS3 Complex', i: '11-3185/3186', d: 'Parallel/Axial Connector Open', f: 680 },
  { g: 'CapSure™ PS3 Complex', i: '11-3157/3159', d: 'Parallel/Axial Connector Closed', f: 680 },
  // Sniper Spine System
  {
    g: 'Sniper™ Spine',
    i: '11-4420 to 11-4890',
    d: 'Cannulated Polyaxial Screw Assembly 4.5-8.5mm',
    f: 1156,
  },
  { g: 'Sniper™ Spine', i: '11-4422 to 11-4442', d: 'Extended Tab Screw 4.5mm', f: 1210.4 },
  {
    g: 'Sniper™ Spine',
    i: '11-4446 to 11-4861',
    d: 'Extended Tab Screw 4.5-8.5mm (all sizes)',
    f: 1210.4,
  },
  {
    g: 'Sniper™ Spine',
    i: '11-4193 to 11-4216',
    d: 'Sniper Reduction Screw Assy 5.5-7.5mm',
    f: 1210.4,
  },
  {
    g: 'Sniper™ Spine',
    i: '11-4030 to 11-4150',
    d: 'Percutaneous Curved/Straight Rod Multi-Angled 5.5mm',
    f: 300,
  },
  {
    g: 'Sniper™ Spine',
    i: '11-4602 to 11-4616',
    d: 'Percutaneous Rod CoCr Curved 35-120mm',
    f: 378.02,
  },
  {
    g: 'Sniper™ Spine',
    i: '11-4579/4599',
    d: 'Percutaneous Rod CoCr Straight 200/500mm',
    f: 378.02,
  },
  { g: 'Sniper™ Spine', i: '11-4102 to 11-4124', d: 'MIG Rod Curved 5.5mm (all lengths)', f: 300 },
  { g: 'Sniper™ Spine', i: '11-4092 to 11-4099', d: 'MIG Rod Curved 5.5 x 35-52.5mm', f: 300 },
  { g: 'Sniper™ Spine', i: '11-4112 to 11-4119', d: 'MIG Rod Curved 5.5 x 55-72.5mm', f: 300 },
  { g: 'Sniper™ Spine', i: '11-4001', d: 'MIS Locking Screw', f: 160 },
  { g: 'Sniper™ Spine', i: '11-4002', d: 'MIS Locking Screw, Extended Tab', f: 160 },
  { g: 'Sniper™ Spine', i: '10-4125 to 10-4129', d: 'Guide Wire 1.6mmX19" (various tips)', f: 75 },
  {
    g: 'Sniper™ Spine',
    i: 'TJC6008/TJC6011',
    d: 'CareFusion Jamshidi Biopsy Needle 8G/11G',
    f: 150,
  },
  // Annex Adjacent Level System
  {
    g: 'Annex™ Adjacent Level',
    i: '11-5040 to 11-5202',
    d: 'Annex Device Full/Half Jog/No Jog 5.5mm (all)',
    f: 3600,
  },
  { g: 'Annex™ Adjacent Level', i: '11-5002', d: 'Annex Locking Screw T30', f: 156 },
  // Salvo Spine System
  {
    g: 'Salvo™ Spine',
    i: '11-6658 to 11-6903',
    d: 'Screw 2.0 (4.5-10.5mm x 20-140mm, all sizes)',
    f: 503.2,
  },
  {
    g: 'Salvo™ Spine',
    i: '11-6904 to 11-7056',
    d: 'Screw 3.0 (4.5-10.5mm x 20-140mm, all sizes)',
    f: 503.2,
  },
  {
    g: 'Salvo™ Spine',
    i: '11-6535 to 11-6657',
    d: 'Cannulated Screw 2.0 (4.5-10.5mm, all sizes)',
    f: 710.4,
  },
  {
    g: 'Salvo™ Spine',
    i: '11-6781 to 11-6903',
    d: 'Cannulated Screw 3.0 (4.5-10.5mm, all sizes)',
    f: 710.4,
  },
  // Rods — 4.75mm
  { g: 'Rods 4.75mm', i: '11-7057 to 11-7084', d: '4.75 Ti Curved (25-160mm)', f: 300 },
  { g: 'Rods 4.75mm', i: '11-7140 to 11-7180', d: '4.75 Ti Straight (25-300mm)', f: 300 },
  { g: 'Rods 4.75mm', i: '11-7271 to 11-7297', d: '4.75 CoCr Curved (25-155mm)', f: 320 },
  { g: 'Rods 4.75mm', i: '11-7230 to 11-7270', d: '4.75 CoCr Straight (25-300mm)', f: 320 },
  // Rods — 5.5mm
  { g: 'Rods 5.5mm', i: '11-3030 to 11-3120', d: '5.5 Curved Rod (30-120mm)', f: 300 },
  { g: 'Rods 5.5mm', i: '11-3230 to 11-3301', d: '5.5 Straight Rod (30-300mm)', f: 300 },
  // Rods — 6.0mm
  { g: 'Rods 6.0mm', i: '11-7540 to 11-7567', d: '6.0mm Rod Curved Ti (25-160mm)', f: 300 },
  { g: 'Rods 6.0mm', i: '11-7600 to 11-7640', d: '6.0mm Rod Straight Ti (25-300mm)', f: 300 },
  { g: 'Rods 6.0mm', i: '11-7450 to 11-7477', d: '6.0mm Rod Curved CoCr (25-160mm)', f: 320 },
  { g: 'Rods 6.0mm', i: '11-7490 to 11-7530', d: '6.0mm Rod Straight CoCr (25-300mm)', f: 320 },
  // Jogged Rods
  {
    g: 'Jogged Rods',
    i: '11-0011 to 11-0019',
    d: '4.75 CoCr Jogged Rod Middle/End (110-500mm)',
    f: 320,
  },
  {
    g: 'Jogged Rods',
    i: '11-7349 to 11-7357',
    d: '5.5 Ti Jogged Rod Middle/End (110-500mm)',
    f: 300,
  },
  {
    g: 'Jogged Rods',
    i: '11-7358 to 11-7366',
    d: '5.5 CoCr Jogged Rod Middle/End (110-500mm)',
    f: 320,
  },
  {
    g: 'Jogged Rods',
    i: '11-0070 to 11-0078',
    d: '4.75 Ti Jogged Rod Middle/End (110-500mm)',
    f: 300,
  },
  // Hex Rods
  { g: 'Hex Rods', i: '11-9630 to 11-9650', d: 'Rod 5.5mm Ti Straight Hex (100-600mm)', f: 300 },
  {
    g: 'Hex Rods',
    i: '11-9651 to 11-9671',
    d: 'Rod 5.5mm Cobalt Chromium Straight Hex (100-600mm)',
    f: 342,
  },
  { g: 'Hex Rods', i: '11-9672 to 11-9692', d: 'Rod 6.0mm Ti Straight Hex (100-600mm)', f: 300 },
  {
    g: 'Hex Rods',
    i: '21-0000 to 21-0020',
    d: 'Rod 6.0mm Cobalt Chromium Straight Hex (100-600mm)',
    f: 342,
  },
  // Cross Connectors & Assemblies
  {
    g: 'Cross Connectors',
    i: '11-6532/6533/6534',
    d: 'Cross Connector Assembly 4.75 S/M/L',
    f: 680,
  },
  { g: 'Cross Connectors', i: '11-6402/6403/6404', d: 'Cross Connector 6.0 S/M/L', f: 680 },
  // Connectors
  {
    g: 'Connectors',
    i: '11-7380 to 11-7416',
    d: 'Connector Parallel/Axial (many configs)',
    f: 680,
  },
  { g: 'Connectors', i: '11-7937 to 11-7949', d: 'Offset 4.75/6.0 (U)/(O) x 20-40mm', f: 680 },
  // Yokes
  { g: 'Yokes & Locking', i: '11-6530', d: 'Yoke 4.75', f: 500 },
  { g: 'Yokes & Locking', i: '11-6400', d: 'Yoke Assembly 5.5/6.0', f: 500 },
  { g: 'Yokes & Locking', i: '11-6405', d: 'Reduction Yoke Assembly 5.5/6.0', f: 500 },
  { g: 'Yokes & Locking', i: '11-7100', d: 'NTXT Yoke Assembly 5.5/6.0 Closed', f: 500 },
  { g: 'Yokes & Locking', i: '11-7101', d: 'NTXT Yoke Assembly 5.5/6.0 Open Tab', f: 500 },
  { g: 'Yokes & Locking', i: '11-6531', d: 'Locking Screw 4.75', f: 156 },
  { g: 'Yokes & Locking', i: '11-6401', d: 'Locking Screw 5.5/6.0', f: 156 },
  // Paramount Anterior Cervical Cage
  {
    g: 'Paramount™ Anterior Cervical',
    i: '21-8920 to 21-8971',
    d: 'Anterior Cervical Cage w/ Plate 14-15.5 (W) various (all sizes)',
    f: 2900,
  },
  {
    g: 'Paramount™ Anterior Cervical',
    i: '21-9009 to 21-9022',
    d: 'Graft Containment Plate 14-15.5 (W)',
    f: 150,
  },
  // Stronghold 3D Ti Cervical Device
  {
    g: 'Stronghold™ 3D Cervical',
    i: 'SW-18107-xxxx',
    d: 'Cervical Ti Cage Lordotic (W)15-17.5 x (L)12-14 x (H)5-12mm',
    f: 1877.2,
  },
  {
    g: 'Stronghold™ 3D Cervical',
    i: 'SW-18105-xxxx',
    d: 'Cervical Ti Cage Anatomical (W)15-17.5 x (L)12-14 x (H)5-10mm',
    f: 1877.2,
  },
  {
    g: 'Stronghold™ 3D Cervical',
    i: 'SW-18125-xxxx',
    d: 'Cervical Ti Cage Anatomical (W)17.5 x (L)14 x (H)5-10mm',
    f: 1877.2,
  },
  // ACCENTE Cervical Fusion Device
  {
    g: 'ACCENTE™ Cervical',
    i: '15-4605 to 15-4612',
    d: 'Small Lordotic 12x14 (5-12x6" spacer)',
    f: 1046,
  },
  {
    g: 'ACCENTE™ Cervical',
    i: '15-6605 to 15-6612',
    d: 'Medium Lordotic 14x16 (5-12x6" spacer)',
    f: 1046,
  },
  {
    g: 'ACCENTE™ Cervical',
    i: '15-4005 to 15-4012',
    d: 'Small Parallel 12x14 (5-12x0 spacer)',
    f: 1046,
  },
  {
    g: 'ACCENTE™ Cervical',
    i: '15-6005 to 15-6012',
    d: 'Medium Parallel 14x16 (5-12x0 spacer)',
    f: 1046,
  },
  // Ni-Lock Cervical Fixation
  {
    g: 'Ni-Lock™ Cervical',
    i: '15-1010 to 15-1026',
    d: '1 Level Anterior Cervical Plate (10-26mm)',
    f: 1080,
  },
  {
    g: 'Ni-Lock™ Cervical',
    i: '15-2020 to 15-2044',
    d: '2 Level Anterior Cervical Plate (20-44mm)',
    f: 1200,
  },
  {
    g: 'Ni-Lock™ Cervical',
    i: '15-3040 to 15-3062',
    d: '3 Level Anterior Cervical Plate (40-62mm)',
    f: 1224,
  },
  {
    g: 'Ni-Lock™ Cervical',
    i: '15-4060 to 15-4084',
    d: '4 Level Anterior Cervical Plate (60-84mm)',
    f: 1292,
  },
  { g: 'Ni-Lock™ Cervical', i: '16-9001', d: 'Temporary Fixation Pins', f: 150 },
  { g: 'Ni-Lock™ Cervical', i: 'A070-0028', d: 'Threaded Fixation Pins, Titanium', f: 150 },
  {
    g: 'Ni-Lock™ Cervical',
    i: '16-9002 to 16-9007',
    d: '2.7mm Drill w/ quick connect (10-20mm)',
    f: 273,
  },
  {
    g: 'Ni-Lock™ Cervical',
    i: '16-7010/7012/7014',
    d: '2.4mm Drill w/ quick connect (10-14mm)',
    f: 273,
  },
  {
    g: 'Ni-Lock™ Cervical',
    i: '15-F410 to 15-F420',
    d: 'Variable Self Tapping Screw 4.0mm (10-20mm)',
    f: 280,
  },
  {
    g: 'Ni-Lock™ Cervical',
    i: '15-H410 to 15-H420',
    d: 'Fixed Self Tapping Screw 4.0mm (10-20mm)',
    f: 280,
  },
  {
    g: 'Ni-Lock™ Cervical',
    i: '15-L410 to 15-L418',
    d: 'Variable Self Tapping Screw 4.5mm (10-18mm)',
    f: 280,
  },
  {
    g: 'Ni-Lock™ Cervical',
    i: '15-N410 to 15-N420',
    d: 'Fixed Self Tapping Screw 4.5mm (10-20mm)',
    f: 280,
  },
  {
    g: 'Ni-Lock™ Cervical',
    i: '15-E412/E414/E416',
    d: 'Variable Self Drilling Screw 3.75mm (12-16mm)',
    f: 280,
  },
  {
    g: 'Ni-Lock™ Cervical',
    i: '15-P410 to 15-P420',
    d: 'Variable Self Drilling Screw 4.0mm (10-20mm)',
    f: 280,
  },
  {
    g: 'Ni-Lock™ Cervical',
    i: '15-R410 to 15-R420',
    d: 'Fixed Self Drilling Screw 4.0mm (10-20mm)',
    f: 280,
  },
  // Defender Anterior Cervical Plate
  {
    g: 'Defender™ Cervical Plate',
    i: '15-5108 to 15-5126',
    d: 'Defender 1Level (8-26mm)',
    f: 1080,
  },
  {
    g: 'Defender™ Cervical Plate',
    i: '15-5222 to 15-5246',
    d: 'Defender 2Level (22-46mm)',
    f: 1200,
  },
  {
    g: 'Defender™ Cervical Plate',
    i: '15-5336 to 15-5369',
    d: 'Defender 3Level (36-69mm)',
    f: 1224,
  },
  {
    g: 'Defender™ Cervical Plate',
    i: '15-5446 to 15-5478',
    d: 'Defender 4Level (46-78mm)',
    f: 1292,
  },
  {
    g: 'Defender™ Cervical Plate',
    i: '15-5571 to 15-5591',
    d: 'Defender 5Level (71-91mm)',
    f: 1360,
  },
  {
    g: 'Defender™ Cervical Plate',
    i: '15-5610 to 15-5622',
    d: 'Defender Fixed Self Drilling Screw 4.0mm',
    f: 280,
  },
  {
    g: 'Defender™ Cervical Plate',
    i: '15-5630 to 15-5642',
    d: 'Defender Fixed Self Drilling Screw 4.35mm',
    f: 280,
  },
  {
    g: 'Defender™ Cervical Plate',
    i: '15-5710 to 15-5722',
    d: 'Defender Fixed Self Tapping Screw 4.0mm',
    f: 280,
  },
  {
    g: 'Defender™ Cervical Plate',
    i: '15-5730 to 15-5742',
    d: 'Defender Fixed Self Tapping Screw 4.35mm',
    f: 280,
  },
  {
    g: 'Defender™ Cervical Plate',
    i: '15-5810 to 15-5833',
    d: 'Defender Variable Self Drilling Screw 4.0/4.35mm',
    f: 280,
  },
  // Proficient Posterior Cervical
  {
    g: 'Proficient™ Cervical',
    i: '21-8318 to 21-8376',
    d: 'Polyaxial Screw Cervical 3.8-5.5mm (all sizes)',
    f: 960,
  },
  {
    g: 'Proficient™ Cervical',
    i: '11-8053 to 11-8086',
    d: 'Polyaxial Screw Cervical 4.6-5.5mm',
    f: 960,
  },
  {
    g: 'Proficient™ Cervical',
    i: '11-9320 to 11-9434',
    d: 'CT Polyaxial Smooth Shank Screw 3.8-4.2mm',
    f: 960,
  },
  {
    g: 'Proficient™ Cervical',
    i: '21-8410 to 21-8468',
    d: 'Proficient CT Extended Tab Polyaxial 3.8-4.2mm',
    f: 1216,
  },
  {
    g: 'Proficient™ Cervical',
    i: '11-8145 to 11-8178',
    d: 'Proficient CT Extended Tab Polyaxial 4.6-5.5mm',
    f: 1216,
  },
  {
    g: 'Proficient™ Cervical',
    i: '11-9897 to 11-9734',
    d: 'CT Translation Screw 3.8-4.2mm',
    f: 1194,
  },
  { g: 'Proficient™ Cervical', i: '11-8899', d: 'Locking Screw', f: 150 },
  { g: 'Proficient™ Cervical', i: '11-8555', d: 'Locking Screw T15', f: 150 },
  { g: 'Proficient™ Cervical', i: '10-8550', d: 'Guide Wire Trocar 1mm x 280mm', f: 357.75 },
  {
    g: 'Proficient™ Cervical',
    i: '10-8582/8583/8584',
    d: 'Proficient Tap CT 3.3-4.1mm',
    f: 515.25,
  },
  { g: 'Proficient™ Cervical', i: '10-8504/8505', d: 'Drill Fixed 2.5mm x 12/14mm', f: 273 },
  { g: 'Proficient™ Cervical', i: '10-8506/8507', d: 'Drill Adjustable 2.5/3.3mm', f: 273 },
  // Proficient CT Rods
  {
    g: 'Proficient™ CT Rods',
    i: '21-9050 to 21-9084',
    d: 'CT Straight Bulleted Rod Ti 3.5mm (30-400mm)',
    f: 288,
  },
  {
    g: 'Proficient™ CT Rods',
    i: '21-9120 to 21-9138',
    d: 'CT Curved Bulleted Rod Ti 3.5mm (30-120mm)',
    f: 288,
  },
  {
    g: 'Proficient™ CT Rods',
    i: '21-9158 to 21-9192',
    d: 'CT Straight Bulleted Rod CoCr 3.5mm (30-400mm)',
    f: 331.25,
  },
  {
    g: 'Proficient™ CT Rods',
    i: '21-9228 to 21-9246',
    d: 'CT Curved Bulleted Rod CoCr 3.5mm (30-120mm)',
    f: 331.25,
  },
  {
    g: 'Proficient™ CT Rods',
    i: '21-9139 to 21-9157',
    d: 'Curved Bulleted Rod Ti 4.0mm (30-120mm)',
    f: 288,
  },
  {
    g: 'Proficient™ CT Rods',
    i: '21-9085 to 21-9119',
    d: 'CT Straight Bulleted Rod Ti 4.0mm (30-400mm)',
    f: 288,
  },
  {
    g: 'Proficient™ CT Rods',
    i: '11-8650 to 11-8868',
    d: 'Curved/Straight Rod CT Ti 3.5-4.0mm (all)',
    f: 288,
  },
  {
    g: 'Proficient™ CT Rods',
    i: '11-8721 to 11-8941',
    d: 'Curved/Straight Rod CT CoCr 3.5-4.0mm (all)',
    f: 331.25,
  },
  {
    g: 'Proficient™ CT Rods',
    i: '21-8001 to 21-8006',
    d: 'Transition Rod Ti 4.0mm x 5.5mm (100-600mm)',
    f: 288,
  },
  {
    g: 'Proficient™ CT Rods',
    i: '21-8042 to 21-8047',
    d: 'Transition Rod CoCr 4.0mm x 5.5mm (100-600mm)',
    f: 331.25,
  },
  {
    g: 'Proficient™ CT Rods',
    i: '11-8526 to 11-8531',
    d: 'Transition Rod Ti 3.5mm x 5.5mm (100-600mm)',
    f: 288,
  },
  {
    g: 'Proficient™ CT Rods',
    i: '11-8567 to 11-8572',
    d: 'Transition Rod CoCr 3.5mm x 5.5mm (100-600mm)',
    f: 331.25,
  },
  // Proficient CT Cross Connectors
  {
    g: 'Proficient™ CT Connectors',
    i: '11-8535 to 11-8542',
    d: 'Cross Connector Screw-to-Screw / Rod-to-Rod',
    f: 680,
  },
  {
    g: 'Proficient™ CT Connectors',
    i: '11-8543',
    d: 'Locking Screw Rod-to-Rod Cross Connector',
    f: 150,
  },
  {
    g: 'Proficient™ CT Connectors',
    i: '11-9200 to 11-9249',
    d: 'Connector Parallel/Axial (many configs)',
    f: 680,
  },
  {
    g: 'Proficient™ CT Connectors',
    i: '11-9232/9242',
    d: 'Connector Offset 4.0 ROD x 11/21mm',
    f: 680,
  },
  { g: 'Proficient™ CT Connectors', i: '11-9231', d: 'Connector 2.5 Hex Locking Screw', f: 150 },
  { g: 'Proficient™ CT Connectors', i: '10-8213', d: 'Drill 3.5mm', f: 273 },
  { g: 'Proficient™ CT Connectors', i: '10-8219', d: 'Cannulated Drill 5.0mm', f: 273 },
  { g: 'Proficient™ CT Connectors', i: '10-8208', d: 'Guide Wire 1.4mm x 19" Nitinol', f: 75 },
  {
    g: 'Proficient™ CT Connectors',
    i: '14-9081X to 14-9028X',
    d: 'CT MIS/Drill Various (2.9mm adjustable/fixed)',
    f: 273,
  },
];
const ROYAL_NS = [
  { g: 'Magnus', i: 'MG-25', d: 'Magnus Viable Cellular Allograft 2.5cc', f: 687.5 },
  { g: 'Magnus', i: 'MG-5', d: 'Magnus Viable Cellular Allograft 5cc', f: 1375 },
  { g: 'Magnus', i: 'MG-10', d: 'Magnus Viable Cellular Allograft 10cc', f: 2750 },
  { g: 'BioReign Luxe', i: 'BRL-1', d: 'BioReign Luxe 1cc', f: 70 },
  { g: 'BioReign Luxe', i: 'BRL-3', d: 'BioReign Luxe 3cc', f: 210 },
  { g: 'BioReign Luxe', i: 'BRL-5', d: 'BioReign Luxe 5cc', f: 350 },
  { g: 'BioReign Luxe', i: 'BRL-10', d: 'BioReign Luxe 10cc', f: 700 },
  { g: 'MaxxFuse DBM Putty w/ Chips', i: 'MFC-1', d: 'MaxxFuse DBM Putty with Chips 1cc', f: 85 },
  {
    g: 'MaxxFuse DBM Putty w/ Chips',
    i: 'MFC-2',
    d: 'MaxxFuse DBM Putty with Chips 2.5cc',
    f: 212.5,
  },
  { g: 'MaxxFuse DBM Putty w/ Chips', i: 'MFC-5', d: 'MaxxFuse DBM Putty with Chips 5cc', f: 425 },
  {
    g: 'MaxxFuse DBM Putty w/ Chips',
    i: 'MFC-10',
    d: 'MaxxFuse DBM Putty with Chips 10cc',
    f: 850,
  },
  { g: 'MaxxFuse Sure Chip', i: 'BC-15', d: 'MaxxFuse Sure Chip Cancellous 1-4mm 15cc', f: 180 },
  { g: 'MaxxFuse Sure Chip', i: 'BC-30', d: 'MaxxFuse Sure Chip Cancellous 1-4mm 30cc', f: 360 },
  { g: 'MaxxCell', i: 'MXC-2', d: 'MaxxCell Bone Marrow Aspirate System', f: 600 },
  { g: 'MaxxCell', i: 'MXC-3', d: 'MaxxCell BMA System w/ 8ga bone harvest trephine', f: 600 },
  {
    g: 'Bio-Reign 3D Granules',
    i: 'BR-G5',
    d: 'Bio-Reign 3D Bioactive Matrix Granules Small',
    f: 700,
  },
  {
    g: 'Bio-Reign 3D Granules',
    i: 'BR-G10',
    d: 'Bio-Reign 3D Bioactive Matrix Granules Medium',
    f: 1300,
  },
  {
    g: 'Advanced Cell Kits',
    i: 'AC-5',
    d: 'Advanced Cell — BioReign 3D Strip 5cc + MaxxCell BMA',
    f: 1300,
  },
  {
    g: 'Advanced Cell Kits',
    i: 'AC-10',
    d: 'Advanced Cell — BioReign 3D Strip 10cc + MaxxCell BMA',
    f: 1900,
  },
  {
    g: 'Advanced Cell Kits',
    i: 'ACG-10',
    d: 'Advanced Cell — BioReign 3D 10cc Granules + MaxxCell BMA',
    f: 1900,
  },
  {
    g: 'Bio-Reign 3D Sheet',
    i: 'BR-s25x50x3',
    d: 'Bio-Reign 3D Bioactive Matrix Sheet 25x50x3mm',
    f: 700,
  },
  {
    g: 'Bio-Reign Moldable',
    i: 'BR-025',
    d: 'Bio-Reign Bioactive Moldable Bone Graft 2.5cc Strip',
    f: 437.5,
  },
  {
    g: 'Bio-Reign Moldable',
    i: 'BR-05',
    d: 'Bio-Reign Bioactive Moldable Bone Graft 5cc Strip',
    f: 875,
  },
  {
    g: 'Bio-Reign Moldable',
    i: 'BR-010',
    d: 'Bio-Reign Bioactive Moldable Bone Graft 10cc Strip',
    f: 1750,
  },
];
const CELL_NS = [
  { g: 'Cellerate RX', i: 'WCI-01-SACRXP', d: 'Cellerate RX Surgical Powder 1g', f: 415 },
  { g: 'Cellerate RX', i: 'WCI-05-SACRXP', d: 'Cellerate RX Surgical Powder 5g', f: 1399 },
];
const CELL_NEGA = [
  { g: 'Cellerate RX', i: 'WCI-01-SACRXP', d: 'Cellerate RX Surgical Powder 1g', f: 405 },
  { g: 'Cellerate RX', i: 'WCI-05-SACRXP', d: 'Cellerate RX Surgical Powder 5g', f: 1399 },
];
const MIMEDX_NS = [
  { g: 'EpiFix', i: 'GS-5440', d: 'EpiFix 4.0x4.0cm', f: 2895 },
  { g: 'AmnioEffect', i: 'LS-5460', d: 'AmnioEffect 4x6cm', f: 2160 },
  { g: 'AmnioFix', i: 'AAS-5460', d: 'AmnioFix 4x6cm', f: 1800 },
];
const MIMEDX_NEGA = [
  { g: 'EpiFix', i: 'GS-5440', d: 'EpiFix 4.0x4.0cm', f: 2895 },
  { g: 'AmnioEffect', i: 'LS-5460', d: 'AmnioEffect 4x6cm', f: 2160 },
  { g: 'AmnioFix', i: 'AAS-5460', d: 'AmnioFix 4x6cm', f: 1800 },
  { g: 'AxioFill', i: 'PCM-0500', d: 'AxioFill 500mg', f: 1095 },
];
const SHEETS_ALL = {
  Xtant: {
    'Northeast Georgia': { label: 'NEGA #10009722 — July 2025', data: NEGA },
    Northside: { label: 'Northside Hospital — Nov 2025', data: NS },
  },
  ISTO: { Northside: { label: 'Northside Hospital — Contracted', data: ISTO_NS } },
  Spinewave: { Northside: { label: 'Northside Health GA — Eff. 2/16/2024', data: SW_NS } },
  Royal: { Northside: { label: 'Northside Hospital — Contracted', data: ROYAL_NS } },
  Cellerate: {
    Northside: { label: 'Northside Hospital — Contracted', data: CELL_NS },
    'Northeast Georgia': { label: 'NEGA — Contracted', data: CELL_NEGA },
  },
  MiMedx: {
    Northside: { label: 'Northside Hospital — Contracted', data: MIMEDX_NS },
    'Northeast Georgia': { label: 'NEGA — Contracted', data: MIMEDX_NEGA },
  },
};
const SHEETS_NS = {
  Xtant: { Northside: { label: 'Northside Hospital — Nov 2025', data: NS } },
  ISTO: { Northside: { label: 'Northside Hospital — Contracted', data: ISTO_NS } },
  Spinewave: { Northside: { label: 'Northside Health GA — Eff. 2/16/2024', data: SW_NS } },
  Royal: { Northside: { label: 'Northside Hospital — Contracted', data: ROYAL_NS } },
  Cellerate: { Northside: { label: 'Northside Hospital — Contracted', data: CELL_NS } },
  MiMedx: { Northside: { label: 'Northside Hospital — Contracted', data: MIMEDX_NS } },
};
const SYSTEMS = {
  test: {
    label: 'Test',
    prefix: 'goodole2026',
    facilities: ['Northeast Georgia', 'Northside'],
    sheets: SHEETS_ALL,
    csv: 'Test_Products_2026.csv',
    color: '#f80',
  },
  kancherla: {
    label: 'Kancherla',
    prefix: 'kancherla',
    facilities: ['Northside'],
    sheets: SHEETS_NS,
    csv: 'Kancherla_Products_2026.csv',
    color: '#0f0',
  },
  burch: {
    label: 'Burch',
    prefix: 'burch',
    facilities: ['Northeast Georgia', 'Northside'],
    sheets: SHEETS_ALL,
    csv: 'Burch_Products_2026.csv',
    color: '#6af',
  },
};
const fmt = (n) =>
  '$' + Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export default function Tracker() {
  const [sys, setSys] = useState('test');
  const [sysReady, setSysReady] = useState(false);
  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get('prodtracker-active-system');
        if (r && SYSTEMS[r.value]) setSys(r.value);
      } catch {}
      setSysReady(true);
    })();
  }, []);
  const CFG = SYSTEMS[sys];
  const sk = (key) => CFG.prefix + '-' + key;
  async function loadData() {
    try {
      const r = await window.storage.get(sk('products-v3'), true);
      return JSON.parse(r.value);
    } catch {
      return null;
    }
  }
  async function saveData(d) {
    try {
      await window.storage.set(sk('products-v3'), JSON.stringify(d), true);
      return true;
    } catch {
      return false;
    }
  }
  const switchSys = async (newSys) => {
    if (newSys === sys) return;
    try {
      await window.storage.set('prodtracker-active-system', newSys);
    } catch {}
    setSys(newSys);
    setEntries([]);
    setStatus('loading');
    setPoImages({});
    setBsImages({});
    setCommRates([]);
    setCommReports([]);
    setCommDocs({});
  };
  const [entries, setEntries] = useState([]);
  const [tab, setTab] = useState('products');
  const [vf, setVf] = useState('All');
  const [ff, setFf] = useState('All');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('date-asc');
  const [status, setStatus] = useState('loading');
  const [note, setNote] = useState(null);
  const [form, setForm] = useState({
    vendor: 'Xtant',
    date: '',
    cost: '',
    case_label: '',
    facility: 'Northside',
    productName: '',
    productNumber: '',
    description: '',
    quantity: 1,
    submittedBy: '',
  });
  const [psVendor, setPsVendor] = useState('Xtant');
  const [psFac, setPsFac] = useState('Northside');
  const [psQ, setPsQ] = useState('');
  const [openGroups, setOpenGroups] = useState({});
  const [openPatients, setOpenPatients] = useState({});
  const [poImages, setPoImages] = useState({});
  const [bsImages, setBsImages] = useState({});
  const [viewingPO, setViewingPO] = useState(null);
  const poFileRef = useRef(null);
  const [poTarget, setPoTarget] = useState(null);
  const bsFileRef = useRef(null);
  const [bsTarget, setBsTarget] = useState(null);
  const [snapOpen, setSnapOpen] = useState(false);
  const [snapForm, setSnapForm] = useState({ case_label: '', date: '', vendor: '', docType: 'bs' });
  const [inbox, setInbox] = useState([]);
  const inboxRef = useRef(null);
  const snapFileRef = useRef(null);
  const [sumMonth, setSumMonth] = useState('all');
  // Commission system
  const [commRates, setCommRates] = useState([]);
  const [commReports, setCommReports] = useState([]);
  const [commDocs, setCommDocs] = useState({});
  const [commView, setCommView] = useState('reconcile');
  const [commVf, setCommVf] = useState('All');
  const [commMf, setCommMf] = useState('all');
  const [crForm, setCrForm] = useState({
    vendor: '',
    type: 'flat',
    pct: '',
    product: '',
    perProduct: [],
  });
  const [clForm, setClForm] = useState({
    vendor: '',
    date: '',
    product: '',
    saleAmount: '',
    commPaid: '',
    note: '',
  });
  const commDocRef = useRef(null);
  const [viewingDoc, setViewingDoc] = useState(null);
  const DEFAULT_COMM_RATES = [
    { vendor: 'Amplify', type: 'flat', pct: 45, perProduct: [] },
    { vendor: '4WEB', type: 'per-product', pct: 50, perProduct: [{ product: 'TLIF', pct: 60 }] },
    { vendor: 'Altus', type: 'flat', pct: 55, perProduct: [] },
    { vendor: 'Spinewave', type: 'flat', pct: 40, perProduct: [] },
    { vendor: 'Choice', type: 'per-product', pct: 35, perProduct: [{ product: 'SIJ', pct: 40 }] },
    {
      vendor: 'Royal',
      type: 'per-product',
      pct: 50,
      perProduct: [
        { product: 'Magnus', pct: 40 },
        { product: 'MaxxCell', pct: 40 },
      ],
    },
    { vendor: 'Xtant', type: 'flat', pct: 40, perProduct: [] },
    { vendor: 'MiMedx', type: 'flat', pct: 35, perProduct: [] },
    { vendor: 'Cellerate', type: 'flat', pct: 30, perProduct: [] },
    { vendor: 'Stimulan', type: 'flat', pct: 25, perProduct: [] },
    { vendor: 'CoreLink', type: 'flat', pct: 40, perProduct: [] },
    { vendor: 'Curiteva', type: 'flat', pct: 30, perProduct: [] },
    {
      vendor: 'Providence',
      type: 'per-product',
      pct: 25,
      perProduct: [{ product: 'Bonus (100k+)', pct: 30 }],
    },
  ];
  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get(sk('comm-rates'), true);
        if (r) {
          const parsed = JSON.parse(r.value);
          if (parsed.length > 0) {
            setCommRates(parsed);
            return;
          }
        }
      } catch {}
      setCommRates(DEFAULT_COMM_RATES);
      try {
        await window.storage.set(sk('comm-rates'), JSON.stringify(DEFAULT_COMM_RATES), true);
      } catch {}
    })();
  }, [sys]);
  useEffect(() => {
    (async () => {
      try {
        const r2 = await window.storage.get(sk('comm-reports'), true);
        if (r2) setCommReports(JSON.parse(r2.value));
      } catch {}
      try {
        const r3 = await window.storage.get(sk('comm-docs'), true);
        if (r3) setCommDocs(JSON.parse(r3.value));
      } catch {}
      try {
        const r4 = await window.storage.get(sk('inbox'), true);
        if (r4) setInbox(JSON.parse(r4.value));
      } catch {}
    })();
  }, [sys]);
  const saveCommRates = async (d) => {
    setCommRates(d);
    try {
      await window.storage.set(sk('comm-rates'), JSON.stringify(d), true);
    } catch {}
  };
  const saveCommReports = async (d) => {
    setCommReports(d);
    try {
      await window.storage.set(sk('comm-reports'), JSON.stringify(d), true);
    } catch {}
  };
  const saveCommDocs = async (d) => {
    setCommDocs(d);
    try {
      await window.storage.set(sk('comm-docs'), JSON.stringify(d), true);
    } catch {}
  };
  const saveInbox = async (d) => {
    setInbox(d);
    try {
      await window.storage.set(sk('inbox'), JSON.stringify(d), true);
    } catch {}
  };
  const handleInboxUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const updated = [...inbox];
    for (const file of files) {
      const reader = new FileReader();
      await new Promise((resolve) => {
        reader.onload = () => {
          updated.push({
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
            name: file.name,
            data: reader.result,
            date: new Date().toISOString(),
            status: 'pending',
          });
          resolve();
        };
        reader.readAsDataURL(file);
      });
    }
    await saveInbox(updated);
    e.target.value = '';
    notify(`${files.length} bill sheet(s) uploaded — send to Claude in chat for extraction`);
  };
  const getRate = (vendor, product) => {
    const vr = commRates.find((r) => r.vendor === vendor);
    if (!vr) return null;
    if (vr.type === 'per-product' && vr.perProduct?.length > 0) {
      const lp = (product || '').toLowerCase();
      const pp = vr.perProduct.find((p) => lp.includes(p.product.toLowerCase()));
      return pp ? pp.pct : vr.pct || null;
    }
    return vr.pct || null;
  };
  const handleCommDocUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const updated = { ...commDocs };
    const vendor = clForm.vendor || 'General';
    if (!updated[vendor]) updated[vendor] = [];
    for (const file of files) {
      const reader = new FileReader();
      await new Promise((resolve) => {
        reader.onload = () => {
          updated[vendor].push({
            name: file.name,
            data: reader.result,
            date: new Date().toISOString(),
          });
          resolve();
        };
        reader.readAsDataURL(file);
      });
    }
    await saveCommDocs(updated);
    e.target.value = '';
    notify(`${files.length} commission doc(s) attached to ${vendor}`);
  };
  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get(sk('po-images'), true);
        if (r) setPoImages(JSON.parse(r.value));
      } catch {}
      try {
        const r2 = await window.storage.get(sk('bs-images'), true);
        if (r2) setBsImages(JSON.parse(r2.value));
      } catch {}
    })();
  }, [sys]);
  const savePOs = async (updated) => {
    setPoImages(updated);
    try {
      await window.storage.set(sk('po-images'), JSON.stringify(updated), true);
    } catch {}
  };
  const saveBSs = async (updated) => {
    setBsImages(updated);
    try {
      await window.storage.set(sk('bs-images'), JSON.stringify(updated), true);
    } catch {}
  };
  const handlePOUpload = async (e) => {
    if (!poTarget) return;
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const newPOs = { ...poImages };
    if (!newPOs[poTarget]) newPOs[poTarget] = [];
    for (const file of files) {
      const reader = new FileReader();
      await new Promise((resolve) => {
        reader.onload = () => {
          newPOs[poTarget].push({
            name: file.name,
            data: reader.result,
            date: new Date().toISOString(),
          });
          resolve();
        };
        reader.readAsDataURL(file);
      });
    }
    await savePOs(newPOs);
    setPoTarget(null);
    e.target.value = '';
    notify(`${files.length} PO(s) attached`);
  };
  const handleBSUpload = async (e) => {
    if (!bsTarget) return;
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const newBSs = { ...bsImages };
    if (!newBSs[bsTarget]) newBSs[bsTarget] = [];
    for (const file of files) {
      const reader = new FileReader();
      await new Promise((resolve) => {
        reader.onload = () => {
          newBSs[bsTarget].push({
            name: file.name,
            data: reader.result,
            date: new Date().toISOString(),
          });
          resolve();
        };
        reader.readAsDataURL(file);
      });
    }
    await saveBSs(newBSs);
    setBsTarget(null);
    e.target.value = '';
    notify(`${files.length} Bill Sheet(s) attached`);
  };
  const notify = (m, ok = true) => {
    setNote({ m, ok });
    setTimeout(() => setNote(null), 3000);
  };
  useEffect(() => {
    (async () => {
      try {
        const s = await loadData();
        if (s && s.length > 0) {
          setEntries(s);
        }
        setStatus('connected');
      } catch {
        setEntries([]);
        setStatus('offline');
      }
    })();
  }, [sys]);
  useEffect(() => {
    const t = setInterval(async () => {
      if (status !== 'connected') return;
      try {
        const s = await loadData();
        if (s && s.length !== entries.length) setEntries(s);
      } catch {}
    }, 30000);
    return () => clearInterval(t);
  }, [status, entries.length]);
  const save = async (u, m) => {
    const chrono = [...u].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    setEntries(chrono);
    if (status === 'connected') await saveData(chrono);
    if (m) notify(m);
  };
  const refresh = async () => {
    try {
      const s = await loadData();
      if (s) {
        setEntries(s);
        notify('Refreshed — ' + s.length + ' items');
      }
    } catch {
      notify('Failed', false);
    }
  };
  const lookup = (item, fac) => {
    for (const cats of [
      fac === 'Northside' ? NS : NEGA,
      ISTO_NS,
      SW_NS,
      ROYAL_NS,
      fac === 'Northside' ? CELL_NS : CELL_NEGA,
      fac === 'Northside' ? MIMEDX_NS : MIMEDX_NEGA,
    ]) {
      const m = cats.find((x) => x.i === item);
      if (m) return m.f;
    }
    return null;
  };
  const pick = (item) => {
    const price = lookup(item.i, form.facility);
    setForm((f) => ({
      ...f,
      productName: item.p,
      productNumber: item.i,
      description: item.d,
      cost: price || item.f,
    }));
    setTab('add');
    notify(`${item.d} — ${fmt(price || item.f)} (${form.facility})`);
  };
  const add = async () => {
    if (
      !form.vendor ||
      !form.date ||
      !form.cost ||
      !form.productName ||
      !form.facility
    ) {
      notify('Fill all required fields', false);
      return;
    }
    const e = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      vendor: form.vendor,
      facility: form.facility,
      date: form.date,
      cost: Number(form.cost),
      case_label: form.case_label,
      productName: form.productName,
      productNumber: form.productNumber,
      description: form.description,
      quantity: Number(form.quantity) || 1,
      dateSubmitted: new Date().toISOString().slice(0, 10),
      submittedBy: form.submittedBy || '',
    };
    await save([...entries, e], `Added: ${e.productName} — ${e.facility} — ${fmt(e.cost)}`);
    setForm((f) => ({
      ...f,
      cost: '',
      case_label: '',
      productName: '',
      productNumber: '',
      description: '',
      quantity: 1,
    }));
  };
  const del = async (id) => {
    const e = entries.find((x) => x.id === id);
    await save(
      entries.filter((x) => x.id !== id),
      `Removed: ${e?.productName || 'entry'}`
    );
  };
  const csv = () => {
    const c =
      'Vendor,Facility,Date,Cost,Case Label,Product,Item#,Description,Qty,DateSubmitted,SubmittedBy\n' +
      entries
        .map(
          (e) =>
            `"${e.vendor}","${e.facility}","${e.date}",${e.cost},"${e.case_label || ''}","${e.productName}","${e.productNumber || ''}","${e.description || ''}",${e.quantity || 1},"${e.dateSubmitted || ''}","${e.submittedBy || ''}"`
        )
        .join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([c], { type: 'text/csv' }));
    a.download = CFG.csv;
    a.click();
    notify('CSV downloaded!');
  };
  const dlFile = (content, filename) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([content], { type: 'text/csv' }));
    a.download = filename;
    a.click();
  };
  const exportRates = () => {
    const rows = ['Vendor,Type,Default %,Product-Specific Rates'];
    commRates.forEach((r) => {
      const ppStr = (r.perProduct || []).map((p) => `${p.product}: ${p.pct}%`).join(' | ');
      rows.push(`"${r.vendor}","${r.type}",${r.pct},"${ppStr}"`);
    });
    dlFile(rows.join('\n'), CFG.label + '_Commission_Rates.csv');
    notify('Rates exported!');
  };
  const exportReports = () => {
    const rows = ['Vendor,Date,Product,Sale Amount,Commission Paid,Note,Added'];
    commReports.forEach((r) => {
      rows.push(
        `"${r.vendor}","${r.date}","${r.product || ''}",${r.saleAmount || 0},${r.commPaid},"${r.note || ''}","${r.addedAt || ''}"`
      );
    });
    dlFile(rows.join('\n'), CFG.label + '_Commission_Reports.csv');
    notify('Reports exported!');
  };
  const exportReconciliation = () => {
    const rows = [
      'Status,Vendor,Date,Product,Sale Amount,Rate %,Expected Commission,Received Commission,Difference,Case Label',
    ];
    const fe = entries.filter(
      (e) =>
        (commVf === 'All' || e.vendor === commVf) &&
        (commMf === 'all' ||
          !e.date ||
          new Date(e.date).getFullYear() +
            '-' +
            String(new Date(e.date).getMonth() + 1).padStart(2, '0') ===
            commMf)
    );
    const cr = commReports.filter(
      (r) =>
        (commVf === 'All' || r.vendor === commVf) &&
        (commMf === 'all' ||
          !r.date ||
          new Date(r.date).getFullYear() +
            '-' +
            String(new Date(r.date).getMonth() + 1).padStart(2, '0') ===
            commMf)
    );
    const matchedIds = new Set();
    fe.forEach((e) => {
      const rate = getRate(e.vendor, e.productName);
      const exp = rate ? (e.cost * rate) / 100 : 0;
      const match = cr.find(
        (r) =>
          r.vendor === e.vendor &&
          r.date === e.date &&
          !matchedIds.has(r.id) &&
          (r.product?.toLowerCase().includes(e.productName?.toLowerCase().slice(0, 8)) ||
            Math.abs(r.saleAmount - e.cost) < 1)
      );
      let status = 'Missing',
        received = 0;
      if (match) {
        matchedIds.add(match.id);
        received = match.commPaid;
        status = !rate
          ? 'No Rate'
          : Math.abs(received - exp) < 1
            ? 'Match'
            : received < exp
              ? 'Underpaid'
              : 'Overpaid';
      } else {
        status = rate ? 'Missing' : 'No Rate';
      }
      const diff = received - exp;
      rows.push(
        `"${status}","${e.vendor}","${e.date}","${e.productName}",${e.cost},${rate || 0},${exp.toFixed(2)},${received.toFixed(2)},${diff.toFixed(2)},"${e.case_label || ''}"`
      );
    });
    cr.filter((r) => !matchedIds.has(r.id)).forEach((r) => {
      rows.push(
        `"Unmatched","${r.vendor}","${r.date}","${r.product || ''}",${r.saleAmount || 0},0,0,${r.commPaid},${r.commPaid},"—"`
      );
    });
    dlFile(rows.join('\n'), CFG.label + '_Commission_Reconciliation.csv');
    notify('Reconciliation exported!');
  };
  let fil = entries;
  if (vf !== 'All') fil = fil.filter((e) => e.vendor === vf);
  if (ff !== 'All') fil = fil.filter((e) => e.facility === ff);
  if (q) {
    const lq = q.toLowerCase();
    fil = fil.filter((e) =>
      [e.productName, e.productNumber, e.case_label, e.description, e.vendor, e.facility].some((x) =>
        x?.toLowerCase().includes(lq)
      )
    );
  }
  if (sort === 'date-desc')
    fil = [...fil].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  else if (sort === 'date-asc')
    fil = [...fil].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  else if (sort === 'cost-desc') fil = [...fil].sort((a, b) => b.cost - a.cost);
  else if (sort === 'vendor') fil = [...fil].sort((a, b) => a.vendor.localeCompare(b.vendor));
  const total = entries.reduce((s, e) => s + e.cost, 0);
  const uv = [...new Set(entries.map((e) => e.vendor))];
  const up = [...new Set(entries.map((e) => e.productName).filter(Boolean))].length;
  const sheet = CFG.sheets[psVendor]?.[psFac];
  let sd = sheet?.data || [];
  if (psQ) {
    const lq = psQ.toLowerCase();
    sd = sd.filter(
      (x) =>
        x.p.toLowerCase().includes(lq) ||
        x.i.toLowerCase().includes(lq) ||
        x.d.toLowerCase().includes(lq)
    );
  }
  const groups = [...new Set(sd.map((x) => x.p))];
  const S = {
    inp: {
      padding: '10px 13px',
      borderRadius: 8,
      border: '1px solid #2a2a35',
      background: '#0e0e18',
      color: '#eee',
      fontSize: 13,
      fontFamily: 'inherit',
      outline: 'none',
      width: '100%',
      boxSizing: 'border-box',
    },
    card: {
      background: '#0e0e18',
      borderRadius: 12,
      border: '1px solid #1a1a28',
      padding: '16px 18px',
    },
  };
  const fc = (f) => (f === 'Northside' ? '#f0a' : '#0af');
  const fl = (f) => (f === 'Northside' ? 'NS' : 'NEGA');
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#08080e',
        color: '#ddd',
        fontFamily: '-apple-system,BlinkMacSystemFont,sans-serif',
        fontSize: 14,
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}@keyframes slideIn{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}.fade{animation:fadeIn .2s ease-out both}.hr:hover{background:rgba(80,160,255,.04)!important}.hb:hover{filter:brightness(1.2)}*{box-sizing:border-box;margin:0;padding:0}input,select,textarea{max-width:100%!important;box-sizing:border-box!important}input[type="date"]{min-width:0!important;width:100%!important}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#2a2a35;border-radius:2px}select{appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23556' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center;padding-right:30px!important}`}</style>
      {note && (
        <div
          style={{
            position: 'fixed',
            top: 'calc(env(safe-area-inset-top) + 8px)',
            right: 'calc(env(safe-area-inset-right) + 12px)',
            zIndex: 999,
            padding: '10px 18px',
            borderRadius: 10,
            background: note.ok ? '#0a2a1a' : '#2a1a0a',
            border: `1px solid ${note.ok ? '#2d5a3d' : '#5a3d2d'}`,
            color: note.ok ? '#6f6' : '#fa6',
            fontSize: 13,
            fontWeight: 600,
            animation: 'slideIn .2s ease-out',
            maxWidth: 360,
          }}
        >
          {note.ok ? '✓' : '!'} {note.m}
        </div>
      )}
      <div
        style={{
          borderBottom: '1px solid #1a1a28',
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>
            <span style={{ color: CFG.color }}>◆</span> Product Tracker
          </div>
          <div
            style={{
              fontSize: 11,
              color: '#445',
              marginTop: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexWrap: 'wrap',
            }}
          >
            <span>
              {entries.length} items · {up} products · {fmt(total)}
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '2px 8px',
                borderRadius: 6,
                fontSize: 9,
                fontWeight: 700,
                background: status === 'connected' ? '#0a1a0a' : '#1a0a0a',
                color: status === 'connected' ? '#4f4' : '#f66',
                border: `1px solid ${status === 'connected' ? '#1e3e1e' : '#3e1e1e'}`,
              }}
            >
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  background: status === 'connected' ? '#4f4' : '#f44',
                }}
              />
              {status === 'connected' ? 'SHARED' : 'LOCAL'}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select
            value={sys}
            onChange={(e) => switchSys(e.target.value)}
            style={{
              padding: '6px 10px',
              borderRadius: 8,
              border: '1px solid ' + CFG.color + '44',
              background: '#0e0e18',
              color: CFG.color,
              cursor: 'pointer',
              fontSize: 11,
              fontWeight: 700,
              appearance: 'none',
              paddingRight: 24,
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23556' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 8px center',
            }}
          >
            {Object.entries(SYSTEMS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
          <button
            onClick={refresh}
            className="hb"
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid #2a2a35',
              background: '#0e0e18',
              color: '#6af',
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            🔄
          </button>
          <button
            onClick={csv}
            className="hb"
            style={{
              padding: '8px 14px',
              borderRadius: 8,
              border: '1px solid #2a2a35',
              background: '#0e0e18',
              color: '#6af',
              cursor: 'pointer',
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            ⬇ CSV
          </button>
        </div>
      </div>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 24px' }}>
        <div
          style={{
            display: 'flex',
            gap: 2,
            marginBottom: 20,
            background: '#0e0e18',
            borderRadius: 10,
            padding: 3,
            width: 'fit-content',
            flexWrap: 'wrap',
          }}
        >
          {[
            { k: 'products', l: 'Products', e: '📦' },
            { k: 'add', l: 'Add', e: '➕' },
            { k: 'patients', l: 'Cases', e: '🗂️' },
            { k: 'mimedx', l: 'MiMedx', e: '🩹' },
            { k: 'commission', l: 'Commission', e: '💵' },
            { k: 'prices', l: 'Price Sheets', e: '💰' },
            { k: 'vendors', l: 'Vendors', e: '🏢' },
            { k: 'summary', l: 'Summary', e: '📊' },
            { k: 'emails', l: 'Emails', e: '📧' },
          ].map((t) => (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              className="hb"
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: tab === t.k ? '#1a1a2a' : 'transparent',
                color: tab === t.k ? '#fff' : '#556',
              }}
            >
              {t.e} {t.l}
            </button>
          ))}
        </div>

        {tab === 'products' && (
          <div className="fade">
            <div
              style={{
                display: 'flex',
                gap: 8,
                marginBottom: 14,
                flexWrap: 'wrap',
                alignItems: 'center',
              }}
            >
              <input
                placeholder="Search..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                style={{ ...S.inp, maxWidth: 200, background: '#0b0b14' }}
              />
              <select
                value={vf}
                onChange={(e) => setVf(e.target.value)}
                style={{ ...S.inp, width: 150 }}
              >
                <option value="All">All Vendors</option>
                {VENDORS.filter((v) => entries.some((e) => e.vendor === v)).map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
              <select
                value={ff}
                onChange={(e) => setFf(e.target.value)}
                style={{ ...S.inp, width: 170 }}
              >
                <option value="All">All Facilities</option>
                {CFG.facilities.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                style={{ ...S.inp, width: 130 }}
              >
                <option value="date-asc">Chronological</option>
                <option value="date-desc">Newest First</option>
                <option value="cost-desc">Cost ↓</option>
                <option value="vendor">Vendor</option>
              </select>
              <span style={{ fontSize: 11, color: '#445', marginLeft: 'auto' }}>
                {fil.length} items · {fmt(fil.reduce((s, e) => s + e.cost, 0))}
              </span>
            </div>
            {fil.length === 0 ? (
              <div style={{ ...S.card, textAlign: 'center', padding: '40px' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>📦</div>
                <div style={{ fontWeight: 600 }}>
                  {entries.length === 0 ? 'No products yet' : 'No matches'}
                </div>
              </div>
            ) : (
              <div style={{ ...S.card, padding: 0, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto', maxHeight: 500 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1150 }}>
                    <thead>
                      <tr>
                        {[
                          'FAC',
                          'VENDOR',
                          'DOS',
                          'PRODUCT',
                          'ITEM#',
                          'DESCRIPTION',
                          'QTY',
                          'COST',
                          'CASE LABEL',
                          'DATE SUBMITTED',
                          'BY',
                          '',
                        ].map((h, i) => (
                          <th
                            key={i}
                            style={{
                              padding: '10px 8px',
                              textAlign: 'left',
                              fontSize: 9,
                              fontWeight: 700,
                              color: '#f80',
                              borderBottom: '1px solid #1a1a28',
                              background: '#08080e',
                              position: 'sticky',
                              top: 0,
                              zIndex: 1,
                              letterSpacing: 1,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {fil.map((e, i) => (
                        <tr
                          key={e.id || i}
                          className="hr"
                          style={{ borderBottom: '1px solid #0e0e18' }}
                        >
                          <td style={{ padding: '7px 8px' }}>
                            <span
                              style={{
                                fontSize: 9,
                                fontWeight: 700,
                                padding: '2px 6px',
                                borderRadius: 5,
                                background: e.facility === 'Northside' ? '#200020' : '#001a2a',
                                color: fc(e.facility),
                                border: `1px solid ${e.facility === 'Northside' ? '#401040' : '#003050'}`,
                              }}
                            >
                              {fl(e.facility)}
                            </span>
                          </td>
                          <td style={{ padding: '7px 8px', fontSize: 12, fontWeight: 600 }}>
                            {e.vendor}
                          </td>
                          <td
                            style={{
                              padding: '7px 8px',
                              fontSize: 11,
                              color: '#667',
                              fontFamily: 'monospace',
                            }}
                          >
                            {e.date}
                          </td>
                          <td
                            style={{
                              padding: '7px 8px',
                              fontSize: 13,
                              fontWeight: 600,
                              color: '#cdf',
                            }}
                          >
                            {e.productName}
                          </td>
                          <td
                            style={{
                              padding: '7px 8px',
                              fontSize: 10,
                              fontFamily: 'monospace',
                              color: '#556',
                            }}
                          >
                            {e.productNumber || '—'}
                          </td>
                          <td
                            style={{
                              padding: '7px 8px',
                              fontSize: 11,
                              color: '#889',
                              maxWidth: 170,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {e.description || '—'}
                          </td>
                          <td style={{ padding: '7px 8px', fontSize: 12, textAlign: 'center' }}>
                            {e.quantity || 1}
                          </td>
                          <td
                            style={{
                              padding: '7px 8px',
                              fontSize: 13,
                              color: '#6f6',
                              fontWeight: 600,
                              fontFamily: 'monospace',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {fmt(e.cost)}
                          </td>
                          <td style={{ padding: '7px 8px', fontSize: 13 }}>{e.case_label || '—'}</td>
                          <td
                            style={{
                              padding: '7px 8px',
                              fontSize: 10,
                              color: '#6af',
                              fontFamily: 'monospace',
                            }}
                          >
                            {e.dateSubmitted || '—'}
                          </td>
                          <td style={{ padding: '7px 8px', fontSize: 11, color: '#9be' }}>
                            {e.submittedBy || '—'}
                          </td>
                          <td style={{ padding: '7px 8px' }}>
                            <button
                              onClick={() => del(e.id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#f44',
                                cursor: 'pointer',
                                fontSize: 11,
                                opacity: 0.3,
                              }}
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'add' && (
          <div className="fade">
            <div style={S.card}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
                Add Product Entry
              </div>
              <div style={{ fontSize: 11, color: '#556', marginBottom: 18 }}>
                Pick from Price Sheets tab to auto-fill, or enter manually.{' '}
                <strong style={{ color: '#fa6' }}>
                  Make sure the correct facility is selected!
                </strong>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 10,
                  marginBottom: 12,
                }}
              >
                <div>
                  <div style={{ fontSize: 10, color: '#f0a', marginBottom: 4, fontWeight: 700 }}>
                    FACILITY *
                  </div>
                  <select
                    value={form.facility}
                    onChange={(e) => setForm((f) => ({ ...f, facility: e.target.value }))}
                    style={{
                      ...S.inp,
                      borderColor: form.facility === 'Northside' ? '#401040' : '#003050',
                    }}
                  >
                    {CFG.facilities.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: '#f80', marginBottom: 4, fontWeight: 700 }}>
                    VENDOR *
                  </div>
                  <select
                    value={form.vendor}
                    onChange={(e) => setForm((f) => ({ ...f, vendor: e.target.value }))}
                    style={S.inp}
                  >
                    <option value="">Select...</option>
                    {VENDORS.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 10,
                  marginBottom: 12,
                }}
              >
                <div style={{ maxWidth: '60%' }}>
                  <div style={{ fontSize: 10, color: '#f80', marginBottom: 4, fontWeight: 700 }}>
                    DATE *
                  </div>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                    style={S.inp}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 10, color: '#f80', marginBottom: 4, fontWeight: 700 }}>
                    CASE LABEL
                  </div>
                  <input
                    placeholder="e.g. Case A, Tue OR"
                    value={form.case_label}
                    onChange={(e) => setForm((f) => ({ ...f, case_label: e.target.value }))}
                    style={S.inp}
                  />
                  <div style={{ fontSize: 9, color: '#445', marginTop: 4 }}>
                    Optional. Do not enter patient identifiers (names, initials, MRN, DOB).
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: '2 1 200px' }}>
                  <div style={{ fontSize: 10, color: '#f80', marginBottom: 4, fontWeight: 700 }}>
                    PRODUCT NAME *
                  </div>
                  <input
                    placeholder="e.g. OsteoFactor Pro"
                    value={form.productName}
                    onChange={(e) => setForm((f) => ({ ...f, productName: e.target.value }))}
                    style={S.inp}
                  />
                </div>
                <div style={{ flex: '1 1 130px' }}>
                  <div style={{ fontSize: 10, color: '#445', marginBottom: 4, fontWeight: 700 }}>
                    ITEM # / REF
                  </div>
                  <input
                    placeholder="e.g. 122010"
                    value={form.productNumber}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, productNumber: e.target.value }));
                      const pr = lookup(e.target.value, form.facility);
                      if (pr) setForm((f) => ({ ...f, cost: pr }));
                    }}
                    style={S.inp}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                <div style={{ flex: '3 1 220px' }}>
                  <div style={{ fontSize: 10, color: '#445', marginBottom: 4, fontWeight: 700 }}>
                    DESCRIPTION
                  </div>
                  <input
                    placeholder="e.g. 10cc, Syringe 5.0cc"
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    style={S.inp}
                  />
                </div>
                <div style={{ flex: '0 0 65px' }}>
                  <div style={{ fontSize: 10, color: '#445', marginBottom: 4, fontWeight: 700 }}>
                    QTY
                  </div>
                  <input
                    type="number"
                    min="1"
                    value={form.quantity}
                    onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                    style={{ ...S.inp, textAlign: 'center' }}
                  />
                </div>
                <div style={{ flex: '1 1 100px' }}>
                  <div style={{ fontSize: 10, color: '#f80', marginBottom: 4, fontWeight: 700 }}>
                    COST ($) *
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={form.cost}
                    onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))}
                    style={S.inp}
                    onKeyDown={(e) => e.key === 'Enter' && add()}
                  />
                </div>
                <div style={{ flex: '1 1 140px' }}>
                  <div style={{ fontSize: 10, color: '#6af', marginBottom: 4, fontWeight: 700 }}>
                    SUBMITTED BY
                  </div>
                  <input
                    placeholder="Team member name"
                    value={form.submittedBy}
                    onChange={(e) => setForm((f) => ({ ...f, submittedBy: e.target.value }))}
                    style={S.inp}
                  />
                </div>
              </div>
              <button
                onClick={add}
                className="hb"
                style={{
                  width: '100%',
                  padding: '13px',
                  borderRadius: 10,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#fff',
                  background: 'linear-gradient(135deg,#f80,#e44)',
                }}
              >
                Add Product Entry ↵
              </button>
              <button
                onClick={() => inboxRef.current?.click()}
                className="hb"
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: 10,
                  border: '2px dashed #a6f44',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#a6f',
                  background: 'linear-gradient(135deg,#1a0a2a,#0a0a1a)',
                  marginTop: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                📷 Upload Bill Sheet / PO
              </button>
              <div style={{ fontSize: 10, color: '#556', textAlign: 'center', marginTop: 4 }}>
                No fields required — upload now, send to Claude in chat to extract data
              </div>
              {inbox.length > 0 && (
                <div
                  style={{
                    marginTop: 8,
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: '#1a0a2a',
                    border: '1px solid #3a1a5a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ fontSize: 11, color: '#a6f', fontWeight: 600 }}>
                    📥 {inbox.filter((i) => i.status === 'pending').length} pending in inbox
                  </span>
                  <button
                    onClick={() => setTab('patients')}
                    className="hb"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#6af',
                      cursor: 'pointer',
                      fontSize: 11,
                    }}
                  >
                    View →
                  </button>
                </div>
              )}
              {form.vendor && form.date && (
                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                  <button
                    onClick={() => {
                      const vKey = (form.case_label || '') + '|' + form.date + '|' + form.vendor;
                      setBsTarget(vKey);
                      setTimeout(() => bsFileRef.current?.click(), 50);
                    }}
                    className="hb"
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: 10,
                      border: '1px solid #3a1a5a',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#a6f',
                      background: '#1a0a2a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    📋 Attach to {form.vendor}
                  </button>
                  <button
                    onClick={() => {
                      const vKey = (form.case_label || '') + '|' + form.date + '|' + form.vendor;
                      setPoTarget(vKey);
                      setTimeout(() => poFileRef.current?.click(), 50);
                    }}
                    className="hb"
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: 10,
                      border: '1px solid #3a2a15',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#f80',
                      background: '#1a1208',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    📎 PO to {form.vendor}
                  </button>
                </div>
              )}
              <div style={{ fontSize: 11, color: '#445', marginTop: 8 }}>
                💡 Type an item # and cost auto-fills for the selected facility.
                Vendor/date/facility persist for batch entry.
              </div>
            </div>
          </div>
        )}

        <input
          type="file"
          accept="image/*,.pdf"
          multiple
          ref={poFileRef}
          style={{ display: 'none' }}
          onChange={handlePOUpload}
        />
        <input
          type="file"
          accept="image/*,.pdf"
          multiple
          ref={bsFileRef}
          style={{ display: 'none' }}
          onChange={handleBSUpload}
        />
        <input
          type="file"
          accept="image/*,.pdf"
          multiple
          ref={inboxRef}
          style={{ display: 'none' }}
          onChange={handleInboxUpload}
        />
        {viewingPO && (
          <div
            onClick={() => setViewingPO(null)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,.85)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              padding: 20,
              cursor: 'zoom-out',
            }}
          >
            <div
              style={{ maxWidth: '90vw', maxHeight: '80vh', position: 'relative' }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setViewingPO(null)}
                style={{
                  position: 'absolute',
                  top: -12,
                  right: -12,
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  background: '#f44',
                  border: 'none',
                  color: '#fff',
                  fontSize: 16,
                  cursor: 'pointer',
                  fontWeight: 700,
                  zIndex: 1001,
                }}
              >
                ✕
              </button>
              {viewingPO.data && viewingPO.data.startsWith('data:image') ? (
                <img
                  src={viewingPO.data}
                  style={{
                    maxWidth: '90vw',
                    maxHeight: '75vh',
                    borderRadius: 8,
                    objectFit: 'contain',
                  }}
                  alt="doc"
                />
              ) : (
                <div
                  style={{ background: '#111', borderRadius: 8, padding: 40, textAlign: 'center' }}
                >
                  <div style={{ fontSize: 48, marginBottom: 12 }}>📄</div>
                  <div style={{ color: '#aab', fontSize: 13 }}>PDF attached</div>
                </div>
              )}
            </div>
            <div
              style={{ display: 'flex', gap: 10, marginTop: 12, alignItems: 'center' }}
              onClick={(e) => e.stopPropagation()}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: 5,
                  background: viewingPO.docType === 'bs' ? '#1a0a3a' : '#1a1a2a',
                  color: viewingPO.docType === 'bs' ? '#a6f' : '#f80',
                  border: '1px solid ' + (viewingPO.docType === 'bs' ? '#3a1a5a' : '#3a2a15'),
                }}
              >
                {viewingPO.docType === 'bs' ? 'BILL SHEET' : 'PO'}
              </span>
              {viewingPO.name && (
                <span style={{ color: '#889', fontSize: 12 }}>{viewingPO.name}</span>
              )}
              <button
                onClick={async () => {
                  const store = viewingPO.docType === 'bs' ? bsImages : poImages;
                  const saveFn = viewingPO.docType === 'bs' ? saveBSs : savePOs;
                  const updated = { ...store };
                  updated[viewingPO.id] = (updated[viewingPO.id] || []).filter(
                    (_, i) => i !== viewingPO.idx
                  );
                  if (updated[viewingPO.id].length === 0) delete updated[viewingPO.id];
                  await saveFn(updated);
                  setViewingPO(null);
                  notify((viewingPO.docType === 'bs' ? 'Bill Sheet' : 'PO') + ' removed');
                }}
                style={{
                  padding: '5px 14px',
                  borderRadius: 7,
                  background: '#f44',
                  border: 'none',
                  color: '#fff',
                  fontSize: 11,
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Remove
              </button>
              <button
                onClick={() => {
                  if (viewingPO.docType === 'bs') {
                    setBsTarget(viewingPO.id);
                    setViewingPO(null);
                    setTimeout(() => bsFileRef.current?.click(), 50);
                  } else {
                    setPoTarget(viewingPO.id);
                    setViewingPO(null);
                    setTimeout(() => poFileRef.current?.click(), 50);
                  }
                }}
                style={{
                  padding: '5px 14px',
                  borderRadius: 7,
                  background: '#1a3a5a',
                  border: '1px solid #2a4a6a',
                  color: '#6af',
                  fontSize: 11,
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                + Add Another
              </button>
            </div>
          </div>
        )}

        {tab === 'patients' && (
          <div className="fade">
            {(() => {
              const cases = {};
              entries.forEach((e) => {
                const k = (e.case_label || '') + '|' + e.date;
                if (!cases[k])
                  cases[k] = {
                    case_label: e.case_label,
                    date: e.date,
                    facility: e.facility,
                    items: [],
                    vendors: new Set(),
                    total: 0,
                  };
                cases[k].items.push(e);
                cases[k].vendors.add(e.vendor);
                cases[k].total += e.cost;
                if (e.facility) cases[k].facility = e.facility;
              });
              const sorted = Object.values(cases).sort((a, b) =>
                (a.date || '').localeCompare(b.date || '')
              );
              if (sorted.length === 0)
                return (
                  <div style={{ ...S.card, textAlign: 'center', padding: 40 }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>🧑‍⚕️</div>
                    <div style={{ fontWeight: 600 }}>No case data yet</div>
                  </div>
                );
              return sorted.map((c, ci) => {
                const key = (c.case_label || '') + '|' + c.date;
                const isOpen = openPatients[key] || false;
                const vg = {};
                c.items.forEach((e) => {
                  if (!vg[e.vendor]) vg[e.vendor] = [];
                  vg[e.vendor].push(e);
                });
                const totalPOs = Object.keys(vg).reduce(
                  (s, v) => (poImages[key + '|' + v] || []).length + s,
                  0
                );
                const totalBSs = Object.keys(vg).reduce(
                  (s, v) => (bsImages[key + '|' + v] || []).length + s,
                  0
                );
                const totalDocs = totalPOs + totalBSs;
                return (
                  <div
                    key={ci}
                    style={{ ...S.card, marginBottom: 10, padding: 0, overflow: 'hidden' }}
                  >
                    <div
                      onClick={() => setOpenPatients((prev) => ({ ...prev, [key]: !prev[key] }))}
                      className="hr"
                      style={{
                        padding: '12px 16px',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        userSelect: 'none',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span
                          style={{
                            fontSize: 12,
                            color: '#556',
                            transition: 'transform .2s',
                            transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                            display: 'inline-block',
                          }}
                        >
                          ▶
                        </span>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 15, fontWeight: 700 }}>{c.case_label || '—'}</span>
                            {totalDocs > 0 && (
                              <span
                                style={{
                                  fontSize: 9,
                                  fontWeight: 700,
                                  padding: '2px 6px',
                                  borderRadius: 5,
                                  background: '#1a1a2a',
                                  color: '#f80',
                                  border: '1px solid #3a2a15',
                                }}
                              >
                                📎 {totalDocs}
                              </span>
                            )}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: '#667',
                              fontFamily: 'monospace',
                              marginTop: 2,
                            }}
                          >
                            {c.date}
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#6f6' }}>
                          {fmt(c.total)}
                        </div>
                        <div style={{ fontSize: 10, color: '#556', marginTop: 2 }}>
                          {c.items.length} items · {[...c.vendors].join(', ')}
                        </div>
                      </div>
                    </div>
                    {isOpen && (
                      <div style={{ borderTop: '1px solid #1a1a28', padding: '8px 16px 12px' }}>
                        <div
                          style={{
                            display: 'flex',
                            gap: 8,
                            marginBottom: 10,
                            flexWrap: 'wrap',
                            alignItems: 'center',
                          }}
                        >
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              padding: '3px 8px',
                              borderRadius: 6,
                              background: c.facility === 'Northside' ? '#200020' : '#001a2a',
                              color: fc(c.facility),
                              border:
                                '1px solid ' + (c.facility === 'Northside' ? '#401040' : '#003050'),
                            }}
                          >
                            {fl(c.facility)}
                          </span>
                        </div>
                        {Object.entries(vg).map(([vendor, items], vi) => {
                          const vKey = key + '|' + vendor;
                          const vendorPOs = poImages[vKey] || [];
                          const hasPO = vendorPOs.length > 0;
                          const vendorBSs = bsImages[vKey] || [];
                          const hasBS = vendorBSs.length > 0;
                          return (
                            <div key={vi} style={{ marginBottom: 10 }}>
                              <div
                                style={{
                                  fontSize: 12,
                                  fontWeight: 700,
                                  color: '#f80',
                                  marginBottom: 6,
                                  paddingBottom: 4,
                                  borderBottom: '1px solid #1a1a28',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                }}
                              >
                                <span>
                                  {vendor} — {fmt(items.reduce((s, e) => s + e.cost, 0))}
                                </span>
                                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                  <button
                                    onClick={(ev) => {
                                      ev.stopPropagation();
                                      if (hasPO) {
                                        setViewingPO({
                                          id: vKey,
                                          idx: 0,
                                          data: vendorPOs[0]?.data,
                                          name: vendor + ' — ' + (c.case_label || '—'),
                                          docType: 'po',
                                        });
                                      } else {
                                        setPoTarget(vKey);
                                        setTimeout(() => poFileRef.current?.click(), 50);
                                      }
                                    }}
                                    className="hb"
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      cursor: 'pointer',
                                      fontSize: 13,
                                      opacity: hasPO ? 1 : 0.25,
                                      filter: hasPO ? 'none' : 'grayscale(1)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 2,
                                    }}
                                    title={hasPO ? 'View PO' : 'Attach PO'}
                                  >
                                    <span style={{ color: hasPO ? '#f80' : '#556' }}>📎</span>
                                    <span
                                      style={{
                                        fontSize: 8,
                                        fontWeight: 700,
                                        color: hasPO ? '#f80' : '#556',
                                      }}
                                    >
                                      PO{hasPO ? ` ${vendorPOs.length}` : ''}
                                    </span>
                                  </button>
                                  <button
                                    onClick={(ev) => {
                                      ev.stopPropagation();
                                      if (hasBS) {
                                        setViewingPO({
                                          id: vKey,
                                          idx: 0,
                                          data: vendorBSs[0]?.data,
                                          name: vendor + ' — ' + (c.case_label || '—'),
                                          docType: 'bs',
                                        });
                                      } else {
                                        setBsTarget(vKey);
                                        setTimeout(() => bsFileRef.current?.click(), 50);
                                      }
                                    }}
                                    className="hb"
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      cursor: 'pointer',
                                      fontSize: 13,
                                      opacity: hasBS ? 1 : 0.25,
                                      filter: hasBS ? 'none' : 'grayscale(1)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 2,
                                    }}
                                    title={hasBS ? 'View Bill Sheet' : 'Attach Bill Sheet'}
                                  >
                                    <span style={{ color: hasBS ? '#a6f' : '#556' }}>📋</span>
                                    <span
                                      style={{
                                        fontSize: 8,
                                        fontWeight: 700,
                                        color: hasBS ? '#a6f' : '#556',
                                      }}
                                    >
                                      BS{hasBS ? ` ${vendorBSs.length}` : ''}
                                    </span>
                                  </button>
                                </div>
                              </div>
                              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <tbody>
                                  {items.map((e, ei) => (
                                    <tr key={ei} style={{ borderBottom: '1px solid #111118' }}>
                                      <td
                                        style={{
                                          padding: '4px 0',
                                          fontSize: 12,
                                          fontWeight: 600,
                                          color: '#cdf',
                                        }}
                                      >
                                        {e.productName}
                                      </td>
                                      <td
                                        style={{
                                          padding: '4px 8px',
                                          fontSize: 10,
                                          fontFamily: 'monospace',
                                          color: '#556',
                                        }}
                                      >
                                        {e.productNumber || ''}
                                      </td>
                                      <td
                                        style={{ padding: '4px 8px', fontSize: 11, color: '#889' }}
                                      >
                                        {e.description || ''}
                                      </td>
                                      <td
                                        style={{
                                          padding: '4px 8px',
                                          fontSize: 11,
                                          color: '#aab',
                                          textAlign: 'center',
                                        }}
                                      >
                                        {e.quantity > 1 ? 'x' + e.quantity : ''}
                                      </td>
                                      <td
                                        style={{
                                          padding: '4px 0',
                                          fontSize: 12,
                                          color: '#6f6',
                                          fontWeight: 600,
                                          fontFamily: 'monospace',
                                          textAlign: 'right',
                                        }}
                                      >
                                        {fmt(e.cost)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              });
            })()}
          </div>
        )}

        {tab === 'mimedx' && (
          <div className="fade">
            <div style={{ ...S.card, marginBottom: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
                🩹 MiMedx Tracking
              </div>
              <div style={{ fontSize: 11, color: '#556', marginBottom: 12 }}>
                All MiMedx products sorted by surgery date — full lot numbers (GS44-...)
              </div>
            </div>
            {(() => {
              const mm = entries
                .filter((e) => e.vendor === 'MiMedx')
                .sort((a, b) => (a.date || '').localeCompare(b.date || ''));
              if (mm.length === 0)
                return (
                  <div style={{ ...S.card, textAlign: 'center', padding: 40 }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>🩹</div>
                    <div style={{ fontWeight: 600 }}>No MiMedx products yet</div>
                  </div>
                );
              const total = mm.reduce((s, e) => s + e.cost, 0);
              return (
                <div style={{ ...S.card, padding: 0, overflow: 'hidden' }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
                      <thead>
                        <tr>
                          {['CASE LABEL', 'DATE', 'ITEM # (LOT)', 'FACILITY', 'COST'].map((h, i) => (
                            <th
                              key={i}
                              style={{
                                padding: '10px 12px',
                                textAlign: 'left',
                                fontSize: 9,
                                fontWeight: 700,
                                color: '#f80',
                                borderBottom: '1px solid #1a1a28',
                                background: '#08080e',
                                position: 'sticky',
                                top: 0,
                                zIndex: 1,
                                letterSpacing: 1,
                              }}
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {mm.map((e, i) => (
                          <tr
                            key={e.id || i}
                            className="hr"
                            style={{ borderBottom: '1px solid #0e0e18' }}
                          >
                            <td style={{ padding: '10px 12px', fontSize: 14, fontWeight: 700 }}>
                              {e.case_label || '—'}
                            </td>
                            <td
                              style={{
                                padding: '10px 12px',
                                fontSize: 12,
                                fontFamily: 'monospace',
                                color: '#aab',
                              }}
                            >
                              {e.date}
                            </td>
                            <td
                              style={{
                                padding: '10px 12px',
                                fontSize: 13,
                                fontWeight: 600,
                                color: '#6af',
                                fontFamily: 'monospace',
                              }}
                            >
                              {e.productNumber}
                            </td>
                            <td style={{ padding: '10px 12px' }}>
                              <span
                                style={{
                                  fontSize: 9,
                                  fontWeight: 700,
                                  padding: '2px 6px',
                                  borderRadius: 5,
                                  background: e.facility === 'Northside' ? '#200020' : '#001a2a',
                                  color: fc(e.facility),
                                  border: `1px solid ${e.facility === 'Northside' ? '#401040' : '#003050'}`,
                                }}
                              >
                                {fl(e.facility)}
                              </span>
                            </td>
                            <td
                              style={{
                                padding: '10px 12px',
                                fontSize: 13,
                                color: '#6f6',
                                fontWeight: 600,
                                fontFamily: 'monospace',
                              }}
                            >
                              {fmt(e.cost)}
                            </td>
                          </tr>
                        ))}
                        <tr style={{ borderTop: '2px solid #2a2a3a', background: '#0a0a14' }}>
                          <td
                            colSpan={2}
                            style={{
                              padding: '10px 12px',
                              fontSize: 12,
                              fontWeight: 700,
                              color: '#f80',
                            }}
                          >
                            {mm.length} units
                          </td>
                          <td colSpan={2}></td>
                          <td
                            style={{
                              padding: '10px 12px',
                              fontSize: 14,
                              fontWeight: 700,
                              color: '#6f6',
                              fontFamily: 'monospace',
                            }}
                          >
                            {fmt(total)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {tab === 'commission' && (
          <div className="fade">
            <div style={{ ...S.card, marginBottom: 14 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <div style={{ fontSize: 15, fontWeight: 700 }}>💵 Commission Tracker</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {['reconcile', 'rates', 'reports', 'docs'].map((v) => (
                    <button
                      key={v}
                      onClick={() => setCommView(v)}
                      className="hb"
                      style={{
                        padding: '6px 12px',
                        borderRadius: 7,
                        border: '1px solid ' + (commView === v ? '#2a5a2a' : '#2a2a3a'),
                        background: commView === v ? '#0a1a0a' : 'transparent',
                        color: commView === v ? '#6f6' : '#556',
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer',
                        textTransform: 'capitalize',
                      }}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <select
                  value={commVf}
                  onChange={(e) => setCommVf(e.target.value)}
                  style={{ ...S.inp, width: 150 }}
                >
                  <option value="All">All Vendors</option>
                  {VENDORS.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
                {commView === 'reconcile' &&
                  (() => {
                    const MONTHS = [
                      'Jan',
                      'Feb',
                      'Mar',
                      'Apr',
                      'May',
                      'Jun',
                      'Jul',
                      'Aug',
                      'Sep',
                      'Oct',
                      'Nov',
                      'Dec',
                    ];
                    const am = [
                      ...new Set(
                        entries
                          .filter((e) => e.date)
                          .map((e) => {
                            const d = new Date(e.date);
                            return (
                              d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')
                            );
                          })
                      ),
                    ].sort();
                    return (
                      <select
                        value={commMf}
                        onChange={(e) => setCommMf(e.target.value)}
                        style={{ ...S.inp, width: 150 }}
                      >
                        <option value="all">All Months</option>
                        {am.map((m) => {
                          const [y, mo] = m.split('-');
                          return (
                            <option key={m} value={m}>
                              {MONTHS[parseInt(mo) - 1]} {y}
                            </option>
                          );
                        })}
                      </select>
                    );
                  })()}
                <select
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value === 'rates') exportRates();
                    else if (e.target.value === 'reports') exportReports();
                    else if (e.target.value === 'reconcile') exportReconciliation();
                    e.target.value = '';
                  }}
                  style={{ ...S.inp, width: 130, color: '#6f6', borderColor: '#2a5a2a' }}
                >
                  <option value="" disabled>
                    ⬇ Export...
                  </option>
                  <option value="rates">Commission Rates</option>
                  <option value="reports">Report Line Items</option>
                  <option value="reconcile">Reconciliation</option>
                </select>
              </div>
            </div>

            {/* RATES SUB-VIEW */}
            {commView === 'rates' && (
              <div>
                <div style={{ ...S.card, marginBottom: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>
                    Set Commission Rates
                  </div>
                  <div style={{ fontSize: 11, color: '#556', marginBottom: 14 }}>
                    Define what each vendor should pay you. Flat % applies to all products;
                    per-product lets you set different rates.
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 10,
                      marginBottom: 10,
                    }}
                  >
                    <div>
                      <div
                        style={{ fontSize: 10, fontWeight: 700, color: '#6f6', marginBottom: 4 }}
                      >
                        VENDOR
                      </div>
                      <select
                        value={crForm.vendor}
                        onChange={(e) => setCrForm((f) => ({ ...f, vendor: e.target.value }))}
                        style={S.inp}
                      >
                        <option value="">Select vendor...</option>
                        {VENDORS.map((v) => (
                          <option key={v} value={v}>
                            {v}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <div
                        style={{ fontSize: 10, fontWeight: 700, color: '#6f6', marginBottom: 4 }}
                      >
                        TYPE
                      </div>
                      <select
                        value={crForm.type}
                        onChange={(e) => setCrForm((f) => ({ ...f, type: e.target.value }))}
                        style={S.inp}
                      >
                        <option value="flat">Flat % (all products)</option>
                        <option value="per-product">Per-Product %</option>
                      </select>
                    </div>
                  </div>
                  {crForm.type === 'flat' && (
                    <div style={{ marginBottom: 10 }}>
                      <div
                        style={{ fontSize: 10, fontWeight: 700, color: '#6f6', marginBottom: 4 }}
                      >
                        COMMISSION %
                      </div>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="e.g. 20"
                        value={crForm.pct}
                        onChange={(e) => setCrForm((f) => ({ ...f, pct: e.target.value }))}
                        style={{ ...S.inp, maxWidth: 120 }}
                      />
                    </div>
                  )}
                  {crForm.type === 'per-product' && (
                    <div style={{ marginBottom: 10 }}>
                      <div
                        style={{ fontSize: 10, fontWeight: 700, color: '#6f6', marginBottom: 4 }}
                      >
                        DEFAULT % (fallback)
                      </div>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="e.g. 15"
                        value={crForm.pct}
                        onChange={(e) => setCrForm((f) => ({ ...f, pct: e.target.value }))}
                        style={{ ...S.inp, maxWidth: 120, marginBottom: 8 }}
                      />
                      <div
                        style={{ fontSize: 10, fontWeight: 700, color: '#f80', marginBottom: 4 }}
                      >
                        PRODUCT-SPECIFIC RATES
                      </div>
                      {(crForm.perProduct || []).map((pp, i) => (
                        <div
                          key={i}
                          style={{ display: 'flex', gap: 6, marginBottom: 4, alignItems: 'center' }}
                        >
                          <input
                            placeholder="Product name"
                            value={pp.product}
                            onChange={(e) => {
                              const u = [...crForm.perProduct];
                              u[i] = { ...u[i], product: e.target.value };
                              setCrForm((f) => ({ ...f, perProduct: u }));
                            }}
                            style={{ ...S.inp, flex: 1 }}
                          />
                          <input
                            type="number"
                            step="0.1"
                            placeholder="%"
                            value={pp.pct}
                            onChange={(e) => {
                              const u = [...crForm.perProduct];
                              u[i] = { ...u[i], pct: e.target.value };
                              setCrForm((f) => ({ ...f, perProduct: u }));
                            }}
                            style={{ ...S.inp, width: 70 }}
                          />
                          <button
                            onClick={() => {
                              const u = [...crForm.perProduct];
                              u.splice(i, 1);
                              setCrForm((f) => ({ ...f, perProduct: u }));
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#f44',
                              cursor: 'pointer',
                              fontSize: 16,
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() =>
                          setCrForm((f) => ({
                            ...f,
                            perProduct: [...(f.perProduct || []), { product: '', pct: '' }],
                          }))
                        }
                        className="hb"
                        style={{
                          fontSize: 11,
                          color: '#6af',
                          background: 'none',
                          border: '1px solid #2a2a3a',
                          padding: '4px 10px',
                          borderRadius: 6,
                          cursor: 'pointer',
                          marginTop: 4,
                        }}
                      >
                        + Add Product Rate
                      </button>
                    </div>
                  )}
                  <button
                    onClick={() => {
                      if (!crForm.vendor || !crForm.pct) {
                        notify('Set vendor and rate', false);
                        return;
                      }
                      const existing = commRates.filter((r) => r.vendor !== crForm.vendor);
                      const newRate = {
                        vendor: crForm.vendor,
                        type: crForm.type,
                        pct: parseFloat(crForm.pct),
                        perProduct: (crForm.perProduct || [])
                          .filter((p) => p.product && p.pct)
                          .map((p) => ({ product: p.product, pct: parseFloat(p.pct) })),
                      };
                      saveCommRates([...existing, newRate]);
                      notify(`Rate saved: ${crForm.vendor} → ${crForm.pct}%`);
                      setCrForm({ vendor: '', type: 'flat', pct: '', product: '', perProduct: [] });
                    }}
                    className="hb"
                    style={{
                      padding: '10px',
                      borderRadius: 8,
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#fff',
                      background: 'linear-gradient(135deg,#4a4,#2a6)',
                      width: '100%',
                    }}
                  >
                    Save Rate
                  </button>
                </div>
                {commRates.length > 0 && (
                  <div style={S.card}>
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>
                      Current Rates
                    </div>
                    {commRates
                      .filter((r) => commVf === 'All' || r.vendor === commVf)
                      .map((r, i) => (
                        <div
                          key={i}
                          className="hr"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '8px 0',
                            borderBottom: '1px solid #111118',
                          }}
                        >
                          <span style={{ fontSize: 13, fontWeight: 600, flex: 1, color: '#cdf' }}>
                            {r.vendor}
                          </span>
                          <span style={{ fontSize: 11, color: '#6f6', fontWeight: 700 }}>
                            {r.pct}%{r.type === 'per-product' ? ' (default)' : ''}
                          </span>
                          {r.type === 'per-product' && r.perProduct?.length > 0 && (
                            <span style={{ fontSize: 10, color: '#889' }}>
                              +{r.perProduct.length} custom
                            </span>
                          )}
                          <button
                            onClick={() => {
                              setCrForm({
                                vendor: r.vendor,
                                type: r.type,
                                pct: String(r.pct),
                                perProduct: (r.perProduct || []).map((p) => ({
                                  product: p.product,
                                  pct: String(p.pct),
                                })),
                              });
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#6af',
                              cursor: 'pointer',
                              fontSize: 11,
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              saveCommRates(commRates.filter((_, j) => j !== i));
                              notify('Rate removed');
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#f44',
                              cursor: 'pointer',
                              fontSize: 11,
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* REPORTS SUB-VIEW — Line items from commission reports */}
            {commView === 'reports' && (
              <div>
                <div style={{ ...S.card, marginBottom: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>
                    Add Commission Line Item
                  </div>
                  <div style={{ fontSize: 11, color: '#556', marginBottom: 14 }}>
                    Enter line items from vendor commission reports. Send me the actual
                    PDF/spreadsheet in chat and I'll extract these for you.
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 10,
                      marginBottom: 10,
                    }}
                  >
                    <div>
                      <div
                        style={{ fontSize: 10, fontWeight: 700, color: '#6f6', marginBottom: 4 }}
                      >
                        VENDOR
                      </div>
                      <select
                        value={clForm.vendor}
                        onChange={(e) => setClForm((f) => ({ ...f, vendor: e.target.value }))}
                        style={S.inp}
                      >
                        <option value="">Select...</option>
                        {VENDORS.map((v) => (
                          <option key={v} value={v}>
                            {v}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <div
                        style={{ fontSize: 10, fontWeight: 700, color: '#6f6', marginBottom: 4 }}
                      >
                        DATE (DOS)
                      </div>
                      <input
                        type="date"
                        value={clForm.date}
                        onChange={(e) => setClForm((f) => ({ ...f, date: e.target.value }))}
                        style={S.inp}
                      />
                    </div>
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#6f6', marginBottom: 4 }}>
                      PRODUCT / DESCRIPTION
                    </div>
                    <input
                      placeholder="e.g. EpiFix 4.0x4.0cm"
                      value={clForm.product}
                      onChange={(e) => setClForm((f) => ({ ...f, product: e.target.value }))}
                      style={S.inp}
                    />
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr 1fr',
                      gap: 10,
                      marginBottom: 10,
                    }}
                  >
                    <div>
                      <div
                        style={{ fontSize: 10, fontWeight: 700, color: '#f80', marginBottom: 4 }}
                      >
                        SALE AMOUNT ($)
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={clForm.saleAmount}
                        onChange={(e) => setClForm((f) => ({ ...f, saleAmount: e.target.value }))}
                        style={S.inp}
                      />
                    </div>
                    <div>
                      <div
                        style={{ fontSize: 10, fontWeight: 700, color: '#6f6', marginBottom: 4 }}
                      >
                        COMM PAID ($)
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={clForm.commPaid}
                        onChange={(e) => setClForm((f) => ({ ...f, commPaid: e.target.value }))}
                        style={S.inp}
                      />
                    </div>
                    <div>
                      <div
                        style={{ fontSize: 10, fontWeight: 700, color: '#445', marginBottom: 4 }}
                      >
                        NOTE
                      </div>
                      <input
                        placeholder="Optional"
                        value={clForm.note}
                        onChange={(e) => setClForm((f) => ({ ...f, note: e.target.value }))}
                        style={S.inp}
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (!clForm.vendor || !clForm.date || !clForm.commPaid) {
                        notify('Fill vendor, date & commission paid', false);
                        return;
                      }
                      const item = {
                        id: Date.now().toString(36),
                        vendor: clForm.vendor,
                        date: clForm.date,
                        product: clForm.product,
                        saleAmount: parseFloat(clForm.saleAmount) || 0,
                        commPaid: parseFloat(clForm.commPaid) || 0,
                        note: clForm.note,
                        addedAt: new Date().toISOString(),
                      };
                      saveCommReports([...commReports, item]);
                      notify(`Commission line added: ${clForm.vendor}`);
                      setClForm((f) => ({
                        ...f,
                        product: '',
                        saleAmount: '',
                        commPaid: '',
                        note: '',
                      }));
                    }}
                    className="hb"
                    style={{
                      padding: '10px',
                      borderRadius: 8,
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#fff',
                      background: 'linear-gradient(135deg,#4a4,#2a6)',
                      width: '100%',
                    }}
                  >
                    Add Line Item
                  </button>
                </div>
                {commReports.length > 0 && (
                  <div style={{ ...S.card, padding: 0, overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                        <thead>
                          <tr>
                            {['VENDOR', 'DATE', 'PRODUCT', 'SALE $', 'COMM PAID', 'NOTE', ''].map(
                              (h, i) => (
                                <th
                                  key={i}
                                  style={{
                                    padding: '10px 8px',
                                    textAlign: 'left',
                                    fontSize: 9,
                                    fontWeight: 700,
                                    color: '#6f6',
                                    borderBottom: '1px solid #1a1a28',
                                    background: '#08080e',
                                    position: 'sticky',
                                    top: 0,
                                    zIndex: 1,
                                    letterSpacing: 1,
                                  }}
                                >
                                  {h}
                                </th>
                              )
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {commReports
                            .filter((r) => commVf === 'All' || r.vendor === commVf)
                            .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
                            .map((r, i) => (
                              <tr
                                key={r.id || i}
                                className="hr"
                                style={{ borderBottom: '1px solid #0e0e18' }}
                              >
                                <td style={{ padding: '7px 8px', fontSize: 12, fontWeight: 600 }}>
                                  {r.vendor}
                                </td>
                                <td
                                  style={{
                                    padding: '7px 8px',
                                    fontSize: 11,
                                    fontFamily: 'monospace',
                                    color: '#aab',
                                  }}
                                >
                                  {r.date}
                                </td>
                                <td style={{ padding: '7px 8px', fontSize: 12, color: '#cdf' }}>
                                  {r.product}
                                </td>
                                <td
                                  style={{
                                    padding: '7px 8px',
                                    fontSize: 12,
                                    fontFamily: 'monospace',
                                    color: '#889',
                                  }}
                                >
                                  {r.saleAmount ? fmt(r.saleAmount) : ''}
                                </td>
                                <td
                                  style={{
                                    padding: '7px 8px',
                                    fontSize: 12,
                                    fontFamily: 'monospace',
                                    color: '#6f6',
                                    fontWeight: 600,
                                  }}
                                >
                                  {fmt(r.commPaid)}
                                </td>
                                <td style={{ padding: '7px 8px', fontSize: 10, color: '#556' }}>
                                  {r.note}
                                </td>
                                <td style={{ padding: '7px 8px' }}>
                                  <button
                                    onClick={() => {
                                      saveCommReports(commReports.filter((x) => x.id !== r.id));
                                      notify('Removed');
                                    }}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      color: '#f44',
                                      cursor: 'pointer',
                                      fontSize: 11,
                                    }}
                                  >
                                    ✕
                                  </button>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                        <tfoot>
                          <tr style={{ background: '#0a0a14', borderTop: '2px solid #2a2a3a' }}>
                            <td
                              colSpan={4}
                              style={{
                                padding: '10px 8px',
                                fontSize: 11,
                                fontWeight: 700,
                                color: '#6f6',
                              }}
                            >
                              {
                                commReports.filter((r) => commVf === 'All' || r.vendor === commVf)
                                  .length
                              }{' '}
                              line items
                            </td>
                            <td
                              style={{
                                padding: '10px 8px',
                                fontSize: 13,
                                fontWeight: 700,
                                color: '#6f6',
                                fontFamily: 'monospace',
                              }}
                            >
                              {fmt(
                                commReports
                                  .filter((r) => commVf === 'All' || r.vendor === commVf)
                                  .reduce((s, r) => s + r.commPaid, 0)
                              )}
                            </td>
                            <td colSpan={2}></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* DOCS SUB-VIEW — Attached commission report files */}
            {commView === 'docs' && (
              <div>
                <div style={{ ...S.card, marginBottom: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                    Commission Report Files
                  </div>
                  <div style={{ fontSize: 11, color: '#556', marginBottom: 14 }}>
                    Drop PDF/image files here for reference. Send the actual files to me in chat for
                    data extraction.
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 10,
                      marginBottom: 10,
                    }}
                  >
                    <div>
                      <div
                        style={{ fontSize: 10, fontWeight: 700, color: '#6f6', marginBottom: 4 }}
                      >
                        VENDOR
                      </div>
                      <select
                        value={clForm.vendor}
                        onChange={(e) => setClForm((f) => ({ ...f, vendor: e.target.value }))}
                        style={S.inp}
                      >
                        <option value="">Select vendor...</option>
                        {VENDORS.map((v) => (
                          <option key={v} value={v}>
                            {v}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                      <button
                        onClick={() => {
                          if (!clForm.vendor) {
                            notify('Select a vendor first', false);
                            return;
                          }
                          commDocRef.current?.click();
                        }}
                        className="hb"
                        style={{
                          padding: '10px 16px',
                          borderRadius: 8,
                          border: '1px solid #2a5a2a',
                          cursor: 'pointer',
                          fontSize: 12,
                          fontWeight: 700,
                          color: '#6f6',
                          background: '#0a1a0a',
                          width: '100%',
                        }}
                      >
                        📄 Upload File
                      </button>
                    </div>
                  </div>
                  <input
                    type="file"
                    accept="image/*,.pdf,.xlsx,.xls,.csv"
                    multiple
                    ref={commDocRef}
                    style={{ display: 'none' }}
                    onChange={handleCommDocUpload}
                  />
                </div>
                {Object.keys(commDocs)
                  .filter((v) => commVf === 'All' || v === commVf)
                  .map((vendor) => (
                    <div key={vendor} style={{ ...S.card, marginBottom: 10 }}>
                      <div
                        style={{ fontSize: 12, fontWeight: 700, color: '#f80', marginBottom: 8 }}
                      >
                        {vendor} — {commDocs[vendor].length} file(s)
                      </div>
                      {commDocs[vendor].map((doc, i) => (
                        <div
                          key={i}
                          className="hr"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '6px 0',
                            borderBottom: '1px solid #111118',
                          }}
                        >
                          <span style={{ fontSize: 18 }}>
                            {doc.name?.endsWith('.pdf') ? '📄' : '🖼️'}
                          </span>
                          <span style={{ fontSize: 12, flex: 1, color: '#cdf' }}>{doc.name}</span>
                          <span style={{ fontSize: 10, color: '#556' }}>
                            {new Date(doc.date).toLocaleDateString()}
                          </span>
                          <button
                            onClick={() => setViewingDoc({ data: doc.data, name: doc.name })}
                            className="hb"
                            style={{
                              background: 'none',
                              border: '1px solid #2a2a3a',
                              color: '#6af',
                              cursor: 'pointer',
                              fontSize: 10,
                              padding: '3px 8px',
                              borderRadius: 5,
                            }}
                          >
                            View
                          </button>
                          <button
                            onClick={async () => {
                              const updated = { ...commDocs };
                              updated[vendor] = updated[vendor].filter((_, j) => j !== i);
                              if (updated[vendor].length === 0) delete updated[vendor];
                              await saveCommDocs(updated);
                              notify('File removed');
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#f44',
                              cursor: 'pointer',
                              fontSize: 11,
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  ))}
                {Object.keys(commDocs).filter((v) => commVf === 'All' || v === commVf).length ===
                  0 && (
                  <div style={{ ...S.card, textAlign: 'center', padding: 40 }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>📄</div>
                    <div style={{ fontWeight: 600 }}>No commission documents yet</div>
                  </div>
                )}
              </div>
            )}

            {/* RECONCILE SUB-VIEW — The money view */}
            {commView === 'reconcile' && (
              <div>
                {(() => {
                  const MONTHS = [
                    'Jan',
                    'Feb',
                    'Mar',
                    'Apr',
                    'May',
                    'Jun',
                    'Jul',
                    'Aug',
                    'Sep',
                    'Oct',
                    'Nov',
                    'Dec',
                  ];
                  const fe = entries.filter((e) => {
                    if (commVf !== 'All' && e.vendor !== commVf) return false;
                    if (commMf !== 'all' && e.date) {
                      const d = new Date(e.date);
                      if (
                        d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') !==
                        commMf
                      )
                        return false;
                    }
                    return true;
                  });
                  const cr = commReports.filter((r) => {
                    if (commVf !== 'All' && r.vendor !== commVf) return false;
                    if (commMf !== 'all' && r.date) {
                      const d = new Date(r.date);
                      if (
                        d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') !==
                        commMf
                      )
                        return false;
                    }
                    return true;
                  });
                  // Build expected commissions from usage
                  const expected = fe.map((e) => {
                    const rate = getRate(e.vendor, e.productName);
                    const expComm = rate ? (e.cost * rate) / 100 : null;
                    return { ...e, rate, expComm };
                  });
                  const totalExpected = expected.reduce((s, e) => s + (e.expComm || 0), 0);
                  const totalReceived = cr.reduce((s, r) => s + r.commPaid, 0);
                  const diff = totalReceived - totalExpected;
                  // Match report lines to usage by date+vendor
                  const matchedIds = new Set();
                  const reconciled = expected.map((e) => {
                    const match = cr.find(
                      (r) =>
                        r.vendor === e.vendor &&
                        r.date === e.date &&
                        !matchedIds.has(r.id) &&
                        (r.product
                          ?.toLowerCase()
                          .includes(e.productName?.toLowerCase().slice(0, 8)) ||
                          Math.abs(r.saleAmount - e.cost) < 1)
                    );
                    if (match) {
                      matchedIds.add(match.id);
                      const status = !e.rate
                        ? 'no-rate'
                        : Math.abs(match.commPaid - (e.expComm || 0)) < 1
                          ? 'match'
                          : match.commPaid < (e.expComm || 0)
                            ? 'under'
                            : 'over';
                      return { ...e, match, status };
                    }
                    return { ...e, match: null, status: e.rate ? 'missing' : 'no-rate' };
                  });
                  const unmatched = cr.filter((r) => !matchedIds.has(r.id));
                  const counts = { match: 0, under: 0, missing: 0, over: 0, 'no-rate': 0 };
                  reconciled.forEach((r) => counts[r.status]++);
                  const mLabel =
                    commMf === 'all'
                      ? 'All Time'
                      : MONTHS[parseInt(commMf.split('-')[1]) - 1] + ' ' + commMf.split('-')[0];
                  return (
                    <>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))',
                          gap: 12,
                          marginBottom: 16,
                        }}
                      >
                        {[
                          { l: 'EXPECTED', v: fmt(totalExpected), c: '#f80' },
                          { l: 'RECEIVED', v: fmt(totalReceived), c: '#6f6' },
                          {
                            l: 'DIFFERENCE',
                            v: (diff >= 0 ? '+' : '') + fmt(diff),
                            c: diff >= 0 ? '#6f6' : '#f44',
                          },
                          { l: '✅ MATCHED', v: counts.match, c: '#6f6' },
                          { l: '⚠️ UNDERPAID', v: counts.under, c: '#fa0' },
                          { l: '❌ MISSING', v: counts.missing, c: '#f44' },
                          { l: '❓ NO RATE', v: counts['no-rate'], c: '#889' },
                        ].map((c, i) => (
                          <div key={i} style={S.card}>
                            <div
                              style={{
                                fontSize: 9,
                                color: '#445',
                                letterSpacing: 1,
                                marginBottom: 6,
                                fontWeight: 700,
                              }}
                            >
                              {c.l}
                            </div>
                            <div style={{ fontSize: 18, fontWeight: 700, color: c.c }}>{c.v}</div>
                          </div>
                        ))}
                      </div>
                      {reconciled.length > 0 && (
                        <div
                          style={{ ...S.card, padding: 0, overflow: 'hidden', marginBottom: 14 }}
                        >
                          <div style={{ overflowX: 'auto', maxHeight: 400 }}>
                            <table
                              style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}
                            >
                              <thead>
                                <tr>
                                  {[
                                    'STATUS',
                                    'VENDOR',
                                    'DATE',
                                    'PRODUCT',
                                    'SALE $',
                                    'RATE',
                                    'EXPECTED',
                                    'RECEIVED',
                                  ].map((h, i) => (
                                    <th
                                      key={i}
                                      style={{
                                        padding: '10px 8px',
                                        textAlign: 'left',
                                        fontSize: 9,
                                        fontWeight: 700,
                                        color: '#6f6',
                                        borderBottom: '1px solid #1a1a28',
                                        background: '#08080e',
                                        position: 'sticky',
                                        top: 0,
                                        zIndex: 1,
                                        letterSpacing: 1,
                                      }}
                                    >
                                      {h}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {reconciled.map((r, i) => {
                                  const sc = {
                                    match: '#6f6',
                                    under: '#fa0',
                                    missing: '#f44',
                                    over: '#0af',
                                    'no-rate': '#556',
                                  };
                                  const sl = {
                                    match: '✅',
                                    under: '⚠️',
                                    missing: '❌',
                                    over: '💰',
                                    'no-rate': '—',
                                  };
                                  return (
                                    <tr
                                      key={r.id || i}
                                      className="hr"
                                      style={{ borderBottom: '1px solid #0e0e18' }}
                                    >
                                      <td style={{ padding: '7px 8px', fontSize: 13 }}>
                                        <span title={r.status}>{sl[r.status]}</span>
                                      </td>
                                      <td
                                        style={{
                                          padding: '7px 8px',
                                          fontSize: 12,
                                          fontWeight: 600,
                                        }}
                                      >
                                        {r.vendor}
                                      </td>
                                      <td
                                        style={{
                                          padding: '7px 8px',
                                          fontSize: 11,
                                          fontFamily: 'monospace',
                                          color: '#aab',
                                        }}
                                      >
                                        {r.date}
                                      </td>
                                      <td
                                        style={{ padding: '7px 8px', fontSize: 12, color: '#cdf' }}
                                      >
                                        {r.productName}
                                      </td>
                                      <td
                                        style={{
                                          padding: '7px 8px',
                                          fontSize: 12,
                                          fontFamily: 'monospace',
                                          color: '#889',
                                        }}
                                      >
                                        {fmt(r.cost)}
                                      </td>
                                      <td
                                        style={{
                                          padding: '7px 8px',
                                          fontSize: 11,
                                          color: r.rate ? '#f80' : '#333',
                                        }}
                                      >
                                        {r.rate ? r.rate + '%' : '—'}
                                      </td>
                                      <td
                                        style={{
                                          padding: '7px 8px',
                                          fontSize: 12,
                                          fontFamily: 'monospace',
                                          color: '#f80',
                                        }}
                                      >
                                        {r.expComm ? fmt(r.expComm) : '—'}
                                      </td>
                                      <td
                                        style={{
                                          padding: '7px 8px',
                                          fontSize: 12,
                                          fontFamily: 'monospace',
                                          fontWeight: 600,
                                          color: sc[r.status],
                                        }}
                                      >
                                        {r.match ? fmt(r.match.commPaid) : '—'}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                      {unmatched.length > 0 && (
                        <div style={S.card}>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              marginBottom: 10,
                              color: '#fa0',
                            }}
                          >
                            ❓ Unmatched Commission Payments ({unmatched.length})
                          </div>
                          <div style={{ fontSize: 11, color: '#556', marginBottom: 10 }}>
                            These payments from vendors don't match any tracked usage
                          </div>
                          {unmatched.map((r, i) => (
                            <div
                              key={i}
                              className="hr"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                padding: '6px 0',
                                borderBottom: '1px solid #111118',
                              }}
                            >
                              <span style={{ fontSize: 12, fontWeight: 600, color: '#cdf' }}>
                                {r.vendor}
                              </span>
                              <span
                                style={{ fontSize: 11, fontFamily: 'monospace', color: '#667' }}
                              >
                                {r.date}
                              </span>
                              <span style={{ fontSize: 12, color: '#889', flex: 1 }}>
                                {r.product}
                              </span>
                              <span
                                style={{
                                  fontSize: 12,
                                  fontFamily: 'monospace',
                                  color: '#6f6',
                                  fontWeight: 600,
                                }}
                              >
                                {fmt(r.commPaid)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      {fe.length === 0 && (
                        <div style={{ ...S.card, textAlign: 'center', padding: 40 }}>
                          <div style={{ fontSize: 28, marginBottom: 8 }}>💵</div>
                          <div style={{ fontWeight: 600 }}>
                            No usage data{commVf !== 'All' ? ' for ' + commVf : ''}
                            {commMf !== 'all' ? ' in ' + mLabel : ''}
                          </div>
                          <div style={{ fontSize: 11, color: '#556', marginTop: 6 }}>
                            Add products first, then set rates and enter commission reports
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}

            {/* Doc viewer modal */}
            {viewingDoc && (
              <div
                onClick={() => setViewingDoc(null)}
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(0,0,0,.85)',
                  zIndex: 1000,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  padding: 20,
                  cursor: 'zoom-out',
                }}
              >
                <div
                  style={{ maxWidth: '90vw', maxHeight: '80vh', position: 'relative' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => setViewingDoc(null)}
                    style={{
                      position: 'absolute',
                      top: -12,
                      right: -12,
                      width: 30,
                      height: 30,
                      borderRadius: 15,
                      background: '#f44',
                      border: 'none',
                      color: '#fff',
                      fontSize: 16,
                      cursor: 'pointer',
                      fontWeight: 700,
                      zIndex: 1001,
                    }}
                  >
                    ✕
                  </button>
                  {viewingDoc.data?.startsWith('data:image') ? (
                    <img
                      src={viewingDoc.data}
                      style={{
                        maxWidth: '90vw',
                        maxHeight: '75vh',
                        borderRadius: 8,
                        objectFit: 'contain',
                      }}
                      alt="doc"
                    />
                  ) : (
                    <div
                      style={{
                        background: '#111',
                        borderRadius: 8,
                        padding: 40,
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: 48, marginBottom: 12 }}>📄</div>
                      <div style={{ color: '#aab', fontSize: 13 }}>{viewingDoc.name}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'prices' && (
          <div className="fade">
            <div style={{ ...S.card, marginBottom: 14 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 12,
                  flexWrap: 'wrap',
                  gap: 8,
                }}
              >
                <div style={{ fontSize: 15, fontWeight: 700 }}>💰 Price Sheets</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <select
                    value={psVendor}
                    onChange={(e) => setPsVendor(e.target.value)}
                    style={{ ...S.inp, width: 120 }}
                  >
                    {Object.keys(CFG.sheets).map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                  <select
                    value={psFac}
                    onChange={(e) => setPsFac(e.target.value)}
                    style={{
                      ...S.inp,
                      width: 170,
                      borderColor: psFac === 'Northside' ? '#401040' : '#003050',
                    }}
                  >
                    {CFG.facilities.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {sheet && (
                <div style={{ fontSize: 11, color: '#667', marginBottom: 10 }}>
                  {sheet.label} ·{' '}
                  <span style={{ color: fc(psFac), fontWeight: 600 }}>
                    {sheet.data.length} products
                  </span>
                </div>
              )}
              <input
                placeholder="Search products, item #, description..."
                value={psQ}
                onChange={(e) => setPsQ(e.target.value)}
                style={{ ...S.inp, marginBottom: 8 }}
              />
              <div style={{ fontSize: 10, color: '#556' }}>
                Click any row to auto-fill the Add form with that product + correct facility price
              </div>
            </div>
            {groups.map((g) => {
              const isOpen = openGroups[g] || false;
              const items = sd.filter((x) => x.p === g);
              return (
                <div key={g} style={{ ...S.card, marginBottom: 8, padding: 0, overflow: 'hidden' }}>
                  <div
                    onClick={() => setOpenGroups((p) => ({ ...p, [g]: !p[g] }))}
                    style={{
                      padding: '10px 14px',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      userSelect: 'none',
                    }}
                    className="hr"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          fontSize: 11,
                          color: '#556',
                          transition: 'transform .2s',
                          transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                          display: 'inline-block',
                        }}
                      >
                        ▶
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#f80' }}>{g}</span>
                    </div>
                    <span style={{ fontSize: 10, color: '#445' }}>{items.length} items</span>
                  </div>
                  {isOpen && (
                    <div style={{ borderTop: '1px solid #1a1a28', padding: '4px 14px 8px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <tbody>
                          {items.map((x, i) => (
                            <tr
                              key={i}
                              className="hr"
                              onClick={() => pick(x)}
                              style={{ cursor: 'pointer', borderBottom: '1px solid #111118' }}
                            >
                              <td
                                style={{
                                  padding: '5px 8px',
                                  fontSize: 11,
                                  fontFamily: 'monospace',
                                  color: '#667',
                                  width: 110,
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {x.i}
                              </td>
                              <td style={{ padding: '5px 8px', fontSize: 12, color: '#bbc' }}>
                                {x.d}
                              </td>
                              <td
                                style={{
                                  padding: '5px 8px',
                                  fontSize: 12,
                                  color: '#6f6',
                                  fontWeight: 600,
                                  fontFamily: 'monospace',
                                  textAlign: 'right',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {fmt(x.f)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {tab === 'vendors' && (
          <div className="fade">
            {uv.length === 0 ? (
              <div style={{ ...S.card, textAlign: 'center', padding: 40 }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🏢</div>
                <div style={{ fontWeight: 600 }}>No data yet</div>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))',
                  gap: 14,
                }}
              >
                {uv.map((v) => {
                  const rows = entries.filter((e) => e.vendor === v);
                  const t = rows.reduce((s, r) => s + r.cost, 0);
                  const nt = rows
                    .filter((r) => r.facility === 'Northeast Georgia')
                    .reduce((s, r) => s + r.cost, 0);
                  const nst = rows
                    .filter((r) => r.facility === 'Northside')
                    .reduce((s, r) => s + r.cost, 0);
                  return (
                    <div key={v} style={S.card}>
                      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{v}</div>
                      <div
                        style={{ fontSize: 20, fontWeight: 700, color: '#f80', marginBottom: 8 }}
                      >
                        {fmt(t)}{' '}
                        <span style={{ fontSize: 11, color: '#556' }}>({rows.length})</span>
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                        {nt > 0 && (
                          <span
                            style={{
                              fontSize: 10,
                              color: '#0af',
                              background: '#001a2a',
                              padding: '3px 8px',
                              borderRadius: 6,
                              fontWeight: 700,
                            }}
                          >
                            NEGA: {fmt(nt)}
                          </span>
                        )}
                        {nst > 0 && (
                          <span
                            style={{
                              fontSize: 10,
                              color: '#f0a',
                              background: '#200020',
                              padding: '3px 8px',
                              borderRadius: 6,
                              fontWeight: 700,
                            }}
                          >
                            NS: {fmt(nst)}
                          </span>
                        )}
                      </div>
                      {rows.map((e, i) => (
                        <div
                          key={i}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '3px 0',
                            fontSize: 11,
                            borderBottom: '1px solid #111118',
                          }}
                        >
                          <span style={{ color: '#889' }}>
                            {e.productName}
                            {e.description ? ` (${e.description})` : ''}
                          </span>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <span style={{ color: fc(e.facility), fontSize: 9, fontWeight: 700 }}>
                              {fl(e.facility)}
                            </span>
                            <span style={{ color: '#6f6', fontFamily: 'monospace' }}>
                              {fmt(e.cost)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === 'summary' && (
          <div className="fade">
            {(() => {
              const MONTHS = [
                'January',
                'February',
                'March',
                'April',
                'May',
                'June',
                'July',
                'August',
                'September',
                'October',
                'November',
                'December',
              ];
              const availMonths = [
                ...new Set(
                  entries
                    .filter((e) => e.date)
                    .map((e) => {
                      const d = new Date(e.date);
                      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
                    })
                ),
              ].sort();
              const fe =
                sumMonth === 'all'
                  ? entries
                  : entries.filter((e) => {
                      if (!e.date) return false;
                      const d = new Date(e.date);
                      return (
                        d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') ===
                        sumMonth
                      );
                    });
              const mTotal = fe.reduce((s, e) => s + e.cost, 0);
              const mUp = [...new Set(fe.map((e) => e.productName))].length;
              const mUv = [...new Set(fe.map((e) => e.vendor))];
              const mLabel =
                sumMonth === 'all'
                  ? 'All Time'
                  : MONTHS[parseInt(sumMonth.split('-')[1]) - 1] + ' ' + sumMonth.split('-')[0];
              return (
                <>
                  <div
                    style={{
                      ...S.card,
                      marginBottom: 14,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 10,
                    }}
                  >
                    <div style={{ fontSize: 15, fontWeight: 700 }}>📊 Summary</div>
                    <select
                      value={sumMonth}
                      onChange={(e) => setSumMonth(e.target.value)}
                      style={{ ...S.inp, width: 180 }}
                    >
                      <option value="all">All Time</option>
                      {availMonths.map((m) => {
                        const [y, mo] = m.split('-');
                        return (
                          <option key={m} value={m}>
                            {MONTHS[parseInt(mo) - 1]} {y}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))',
                      gap: 12,
                      marginBottom: 20,
                    }}
                  >
                    {[
                      { l: mLabel.toUpperCase(), v: fmt(mTotal), c: '#6f6' },
                      { l: 'ENTRIES', v: fe.length, c: '#f80' },
                      {
                        l: 'NEGA',
                        v: fmt(
                          fe
                            .filter((e) => e.facility === 'Northeast Georgia')
                            .reduce((s, e) => s + e.cost, 0)
                        ),
                        c: '#0af',
                      },
                      {
                        l: 'NORTHSIDE',
                        v: fmt(
                          fe
                            .filter((e) => e.facility === 'Northside')
                            .reduce((s, e) => s + e.cost, 0)
                        ),
                        c: '#f0a',
                      },
                      { l: 'PRODUCTS', v: mUp, c: '#6af' },
                      { l: 'VENDORS', v: mUv.length, c: '#c6f' },
                    ].map((c, i) => (
                      <div key={i} style={S.card}>
                        <div
                          style={{
                            fontSize: 9,
                            color: '#445',
                            letterSpacing: 1,
                            marginBottom: 6,
                            fontWeight: 700,
                          }}
                        >
                          {c.l}
                        </div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: c.c }}>{c.v}</div>
                      </div>
                    ))}
                  </div>
                  {fe.length > 0 && (
                    <div style={S.card}>
                      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>
                        Vendor Breakdown — {mLabel}
                      </div>
                      {(() => {
                        const vb = {};
                        fe.forEach((e) => {
                          if (!vb[e.vendor]) vb[e.vendor] = { count: 0, cost: 0 };
                          vb[e.vendor].count++;
                          vb[e.vendor].cost += e.cost;
                        });
                        return Object.entries(vb)
                          .sort((a, b) => b[1].cost - a[1].cost)
                          .map(([v, d], i) => (
                            <div
                              key={i}
                              className="hr"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                padding: '8px 0',
                                borderBottom: '1px solid #111118',
                              }}
                            >
                              <span
                                style={{ fontSize: 13, fontWeight: 600, flex: 1, color: '#cdf' }}
                              >
                                {v}
                              </span>
                              <span style={{ fontSize: 11, color: '#f80', fontWeight: 700 }}>
                                {d.count} items
                              </span>
                              <span
                                style={{
                                  fontSize: 12,
                                  color: '#6f6',
                                  fontFamily: 'monospace',
                                  width: 100,
                                  textAlign: 'right',
                                  fontWeight: 600,
                                }}
                              >
                                {fmt(d.cost)}
                              </span>
                            </div>
                          ));
                      })()}
                    </div>
                  )}
                  {fe.length > 0 && (
                    <div style={{ ...S.card, marginTop: 14 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>
                        Most Used Products — {mLabel}
                      </div>
                      {(() => {
                        const c = {};
                        fe.forEach((e) => {
                          c[e.productName] = c[e.productName] || { n: 0, cost: 0 };
                          c[e.productName].n++;
                          c[e.productName].cost += e.cost;
                        });
                        return Object.entries(c)
                          .sort((a, b) => b[1].n - a[1].n)
                          .slice(0, 15)
                          .map(([n, d], i) => (
                            <div
                              key={i}
                              className="hr"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                padding: '6px 0',
                                borderBottom: '1px solid #111118',
                              }}
                            >
                              <span
                                style={{ fontSize: 13, fontWeight: 600, flex: 1, color: '#cdf' }}
                              >
                                {n}
                              </span>
                              <span style={{ fontSize: 11, color: '#f80', fontWeight: 700 }}>
                                {d.n}x
                              </span>
                              <span
                                style={{
                                  fontSize: 11,
                                  color: '#6f6',
                                  fontFamily: 'monospace',
                                  width: 85,
                                  textAlign: 'right',
                                }}
                              >
                                {fmt(d.cost)}
                              </span>
                            </div>
                          ));
                      })()}
                    </div>
                  )}
                  {fe.length > 0 && (
                    <div style={{ ...S.card, marginTop: 14 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>
                        Cases — {mLabel}
                      </div>
                      {(() => {
                        const pc = {};
                        fe.forEach((e) => {
                          const k = (e.case_label || '') + '|' + e.date;
                          if (!pc[k])
                            pc[k] = {
                              case_label: e.case_label,
                              date: e.date,
                              facility: e.facility,
                              cost: 0,
                              items: 0,
                              vendors: new Set(),
                            };
                          pc[k].cost += e.cost;
                          pc[k].items++;
                          pc[k].vendors.add(e.vendor);
                        });
                        return Object.values(pc)
                          .sort((a, b) => b.cost - a.cost)
                          .map((p, i) => (
                            <div
                              key={i}
                              className="hr"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                padding: '8px 0',
                                borderBottom: '1px solid #111118',
                              }}
                            >
                              <span style={{ fontSize: 14, fontWeight: 700, width: 40 }}>
                                {p.case_label || '—'}
                              </span>
                              <span
                                style={{
                                  fontSize: 11,
                                  fontFamily: 'monospace',
                                  color: '#667',
                                  width: 80,
                                }}
                              >
                                {p.date}
                              </span>
                              <span
                                style={{
                                  fontSize: 9,
                                  fontWeight: 700,
                                  padding: '2px 6px',
                                  borderRadius: 5,
                                  background: p.facility === 'Northside' ? '#200020' : '#001a2a',
                                  color: fc(p.facility),
                                  border:
                                    '1px solid ' +
                                    (p.facility === 'Northside' ? '#401040' : '#003050'),
                                }}
                              >
                                {fl(p.facility)}
                              </span>
                              <span style={{ flex: 1 }}></span>
                              <span style={{ fontSize: 10, color: '#889' }}>
                                {p.items} items · {p.vendors.size} vendors
                              </span>
                              <span
                                style={{
                                  fontSize: 13,
                                  color: '#6f6',
                                  fontFamily: 'monospace',
                                  fontWeight: 600,
                                  width: 100,
                                  textAlign: 'right',
                                }}
                              >
                                {fmt(p.cost)}
                              </span>
                            </div>
                          ));
                      })()}
                    </div>
                  )}
                  {fe.length === 0 && (
                    <div style={{ ...S.card, textAlign: 'center', padding: 40 }}>
                      <div style={{ fontSize: 28, marginBottom: 8 }}>📊</div>
                      <div style={{ fontWeight: 600 }}>No data for {mLabel}</div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {tab === 'emails' && (
          <div className="fade">
            <div style={{ ...S.card, marginBottom: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
                📧 Vendor Email Directory
              </div>
              <div style={{ fontSize: 11, color: '#556' }}>
                Contact emails organized by vendor — click any email to copy
              </div>
            </div>
            {(() => {
              const VE = [
                {
                  v: '4Web',
                  emails: [
                    'Rhodge@4webmedical.com',
                    'customerservice@4webmedical.com',
                    'billonly@eleven-medical.com',
                    'binny.virk@eleven-medical.com',
                    'Coled7152@gmail.com',
                  ],
                },
                {
                  v: 'Altus',
                  note: '(Sua Sponte Med)',
                  emails: [
                    'jacqi@suamed.com',
                    'justin@suamed.com',
                    'billonly@eleven-medical.com',
                    'binny.virk@eleven-medical.com',
                    'Coled7152@gmail.com',
                  ],
                },
                {
                  v: 'Amplify',
                  emails: [
                    'customerservice@amplifysurgical.com',
                    'achoi@amplifysurgical.com',
                    'billonly@eleven-medical.com',
                    'binny.virk@eleven-medical.com',
                    'Coled7152@gmail.com',
                  ],
                },
                {
                  v: 'Carlsmed',
                  emails: [
                    'Billing@carlsmed.com',
                    'Dperry@carlsmed.com',
                    'lsonnino@carlsmed.com',
                    'billonly@eleven-medical.com',
                    'binny.virk@eleven-medical.com',
                    'Coled7152@gmail.com',
                  ],
                },
                {
                  v: 'Cellerate',
                  emails: [
                    'hjarriel@sanaramedtech.com',
                    'billonly@eleven-medical.com',
                    'binny.virk@eleven-medical.com',
                    'Coled7152@gmail.com',
                  ],
                },
                {
                  v: 'Choice',
                  emails: [
                    'chouck@choicespine.com',
                    'customerservice@choicespine.com',
                    'billonly@eleven-medical.com',
                    'binny.virk@eleven-medical.com',
                    'Coled7152@gmail.com',
                  ],
                },
                {
                  v: 'CoreLink',
                  note: '(Zavation)',
                  emails: [
                    'craig.barrett@zavation.com',
                    'zachary.jost@zavation.com',
                    'salesorders@zavation.com',
                    'billonly@eleven-medical.com',
                    'binny.virk@eleven-medical.com',
                    'Coled7152@gmail.com',
                  ],
                },
                {
                  v: 'ISTO',
                  emails: [
                    'stantonteam@istobiologics.com',
                    'Chamby@istobiologics.com',
                    'billonly@eleven-medical.com',
                    'binny.virk@eleven-medical.com',
                    'Coled7152@gmail.com',
                  ],
                },
                {
                  v: 'ISTO (NEGA)',
                  note: 'via Reliance Med',
                  emails: [
                    'support@reliancemed.us',
                    'billonly@eleven-medical.com',
                    'binny.virk@eleven-medical.com',
                    'Coled7152@gmail.com',
                  ],
                },
                {
                  v: 'MiMedx',
                  emails: [
                    'dschmidt@mimedx.com',
                    'seaston@mimedx.com',
                    'billonly@eleven-medical.com',
                    'binny.virk@eleven-medical.com',
                    'Coled7152@gmail.com',
                  ],
                },
                {
                  v: 'Providence',
                  emails: [
                    'jwalters@providencemt.com',
                    'ddunning@providencemt.com',
                    'billonly@eleven-medical.com',
                    'binny.virk@eleven-medical.com',
                    'Coled7152@gmail.com',
                  ],
                },
                {
                  v: 'Royal',
                  emails: [
                    'salvatore@royalbiologics.com',
                    'billsheets@royalbiologics.com',
                    'kristen.kilbourn@royalbiologics.com',
                    'billonly@eleven-medical.com',
                    'binny.virk@eleven-medical.com',
                    'Coled7152@gmail.com',
                  ],
                },
                {
                  v: 'Spinewave',
                  emails: [
                    'customerservice@spinewave.com',
                    'billonly@eleven-medical.com',
                    'binny.virk@eleven-medical.com',
                    'Coled7152@gmail.com',
                  ],
                },
                {
                  v: 'Stimulan',
                  note: '(Biocomposites)',
                  emails: [
                    'jes@biocomposites.com',
                    'billonly@eleven-medical.com',
                    'binny.virk@eleven-medical.com',
                    'Coled7152@gmail.com',
                  ],
                },
                {
                  v: 'Xtant',
                  emails: [
                    'CS@xtantmedical.com',
                    'breitzfeld@xtantmedical.com',
                    'billonly@eleven-medical.com',
                    'binny.virk@eleven-medical.com',
                    'Coled7152@gmail.com',
                  ],
                },
              ];
              const copyEmail = (email) => {
                navigator.clipboard.writeText(email);
                notify('Copied: ' + email);
              };
              const copyAll = (v) => {
                const found = VE.find((x) => x.v === v);
                if (found) {
                  navigator.clipboard.writeText(found.emails.join('; '));
                  notify('Copied all ' + found.v + ' emails');
                }
              };
              return (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))',
                    gap: 12,
                  }}
                >
                  {VE.map((ve) => (
                    <div key={ve.v} style={{ ...S.card, padding: 14 }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: 10,
                        }}
                      >
                        <div>
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#f80' }}>
                            {ve.v}
                          </span>
                          {ve.note && (
                            <span style={{ fontSize: 10, color: '#556', marginLeft: 6 }}>
                              {ve.note}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => copyAll(ve.v)}
                          className="hb"
                          style={{
                            padding: '3px 8px',
                            borderRadius: 6,
                            border: '1px solid #2a2a35',
                            background: '#0e0e18',
                            color: '#6af',
                            cursor: 'pointer',
                            fontSize: 10,
                            fontWeight: 600,
                          }}
                        >
                          Copy All
                        </button>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {ve.emails.map((em, i) => (
                          <div
                            key={i}
                            onClick={() => copyEmail(em)}
                            className="hr"
                            style={{
                              padding: '5px 8px',
                              borderRadius: 6,
                              cursor: 'pointer',
                              fontSize: 12,
                              fontFamily: 'monospace',
                              color: em.includes('eleven-medical')
                                ? '#888'
                                : em.includes('Coled7152')
                                  ? '#888'
                                  : '#adf',
                              background: '#0a0a14',
                              border: '1px solid #1a1a28',
                            }}
                          >
                            {em}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* Floating Camera Button */}
        <button
          onClick={() => inboxRef.current?.click()}
          style={{
            position: 'fixed',
            top: 16,
            right: 16,
            width: 40,
            height: 40,
            borderRadius: 20,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: 20,
            color: '#a6f',
            zIndex: 900,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Upload Bill Sheet"
        >
          📷
        </button>

        {/* Targeted snap modal — only used from patient cards for direct attach */}
        {snapOpen && (
          <div
            onClick={() => setSnapOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,.8)',
              zIndex: 950,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20,
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#12121e',
                borderRadius: 16,
                padding: 24,
                width: '100%',
                maxWidth: 400,
                border: '1px solid #2a2a3a',
                overflow: 'hidden',
                boxSizing: 'border-box',
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
                📷 Attach to Case
              </div>
              <div style={{ fontSize: 11, color: '#556', marginBottom: 16 }}>
                Attach a file directly to an existing case/vendor
              </div>
              {(() => {
                const pts = [...new Set(entries.map((e) => (e.case_label || '') + '|' + e.date))].map((k) => {
                  const [p, d] = k.split('|');
                  return { label: p + ' — ' + d, value: k };
                });
                const isNew = snapForm.case_label === '__new__';
                const vendorsInCase =
                  snapForm.case_label && !isNew
                    ? [
                        ...new Set(
                          entries
                            .filter((e) => (e.case_label || '') + '|' + e.date === snapForm.case_label)
                            .map((e) => e.vendor)
                        ),
                      ]
                    : [];
                return (
                  <>
                    <div style={{ marginBottom: 10 }}>
                      <div
                        style={{ fontSize: 10, fontWeight: 700, color: '#a6f', marginBottom: 4 }}
                      >
                        CASE LABEL
                      </div>
                      <select
                        value={snapForm.case_label}
                        onChange={(e) =>
                          setSnapForm((f) => ({
                            ...f,
                            case_label: e.target.value,
                            vendor: '',
                            newCaseLabel: '',
                            newDate: '',
                            newVendor: '',
                          }))
                        }
                        style={S.inp}
                      >
                        <option value="">Select case...</option>
                        {pts.map((p) => (
                          <option key={p.value} value={p.value}>
                            {p.label}
                          </option>
                        ))}
                        <option value="__new__">＋ New Case</option>
                      </select>
                    </div>
                    {isNew && (
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: 10,
                          marginBottom: 10,
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              color: '#a6f',
                              marginBottom: 4,
                            }}
                          >
                            CASE LABEL
                          </div>
                          <input
                            placeholder="e.g. Case A"
                            value={snapForm.newCaseLabel || ''}
                            onChange={(e) =>
                              setSnapForm((f) => ({ ...f, newCaseLabel: e.target.value }))
                            }
                            style={S.inp}
                          />
                        </div>
                        <div>
                          <div
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              color: '#a6f',
                              marginBottom: 4,
                            }}
                          >
                            DOS
                          </div>
                          <input
                            type="date"
                            value={snapForm.newDate || ''}
                            onChange={(e) =>
                              setSnapForm((f) => ({ ...f, newDate: e.target.value }))
                            }
                            style={S.inp}
                          />
                        </div>
                      </div>
                    )}
                    {isNew && (
                      <div style={{ marginBottom: 10 }}>
                        <div
                          style={{ fontSize: 10, fontWeight: 700, color: '#f80', marginBottom: 4 }}
                        >
                          VENDOR
                        </div>
                        <select
                          value={snapForm.newVendor || ''}
                          onChange={(e) =>
                            setSnapForm((f) => ({ ...f, newVendor: e.target.value }))
                          }
                          style={S.inp}
                        >
                          <option value="">Select vendor...</option>
                          {VENDORS.map((v) => (
                            <option key={v} value={v}>
                              {v}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    {!isNew && snapForm.case_label && (
                      <div style={{ marginBottom: 10 }}>
                        <div
                          style={{ fontSize: 10, fontWeight: 700, color: '#f80', marginBottom: 4 }}
                        >
                          VENDOR
                        </div>
                        {vendorsInCase.length > 0 ? (
                          <select
                            value={snapForm.vendor}
                            onChange={(e) => setSnapForm((f) => ({ ...f, vendor: e.target.value }))}
                            style={S.inp}
                          >
                            <option value="">Select vendor...</option>
                            {vendorsInCase.map((v) => (
                              <option key={v} value={v}>
                                {v}
                              </option>
                            ))}
                            <option value="__all__">— All Vendors for this case —</option>
                          </select>
                        ) : (
                          <div style={{ fontSize: 11, color: '#556' }}>
                            No vendors found for this case
                          </div>
                        )}
                      </div>
                    )}
                    {(snapForm.case_label && snapForm.case_label !== '__new__' && snapForm.vendor) ||
                    (isNew && snapForm.newCaseLabel && snapForm.newDate && snapForm.newVendor) ? (
                      <>
                        <div style={{ marginBottom: 10 }}>
                          <div
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              color: '#667',
                              marginBottom: 4,
                            }}
                          >
                            DOCUMENT TYPE
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              onClick={() => setSnapForm((f) => ({ ...f, docType: 'bs' }))}
                              className="hb"
                              style={{
                                flex: 1,
                                padding: '8px',
                                borderRadius: 8,
                                border:
                                  '1px solid ' + (snapForm.docType === 'bs' ? '#a6f' : '#2a2a3a'),
                                background: snapForm.docType === 'bs' ? '#1a0a3a' : 'transparent',
                                color: snapForm.docType === 'bs' ? '#a6f' : '#556',
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              📋 Bill Sheet
                            </button>
                            <button
                              onClick={() => setSnapForm((f) => ({ ...f, docType: 'po' }))}
                              className="hb"
                              style={{
                                flex: 1,
                                padding: '8px',
                                borderRadius: 8,
                                border:
                                  '1px solid ' + (snapForm.docType === 'po' ? '#f80' : '#2a2a3a'),
                                background: snapForm.docType === 'po' ? '#1a1208' : 'transparent',
                                color: snapForm.docType === 'po' ? '#f80' : '#556',
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              📎 PO
                            </button>
                          </div>
                        </div>
                        <button
                          onClick={() => snapFileRef.current?.click()}
                          className="hb"
                          style={{
                            width: '100%',
                            padding: '13px',
                            borderRadius: 10,
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: 14,
                            fontWeight: 700,
                            color: '#fff',
                            background: 'linear-gradient(135deg,#a6f,#63f)',
                          }}
                        >
                          📷 Attach to Case
                        </button>
                      </>
                    ) : null}
                  </>
                );
              })()}
            </div>
          </div>
        )}
        <input
          type="file"
          accept="image/*,.pdf"
          multiple
          ref={snapFileRef}
          style={{ display: 'none' }}
          onChange={async (e) => {
            const files = Array.from(e.target.files);
            if (!files.length) return;
            const isNew = snapForm.case_label === '__new__';
            const pid = isNew ? snapForm.newCaseLabel : snapForm.case_label.split('|')[0];
            const dt = isNew ? snapForm.newDate : snapForm.case_label.split('|')[1];
            const vendors = isNew
              ? [snapForm.newVendor]
              : snapForm.vendor === '__all__'
                ? [
                    ...new Set(
                      entries
                        .filter((x) => (x.case_label || '') + '|' + x.date === snapForm.case_label)
                        .map((x) => x.vendor)
                    ),
                  ]
                : [snapForm.vendor];
            const store = snapForm.docType === 'bs' ? { ...bsImages } : { ...poImages };
            const saveFn = snapForm.docType === 'bs' ? saveBSs : savePOs;
            for (const vendor of vendors) {
              const vKey = pid + '|' + dt + '|' + vendor;
              if (!store[vKey]) store[vKey] = [];
              for (const file of files) {
                const reader = new FileReader();
                await new Promise((resolve) => {
                  reader.onload = () => {
                    store[vKey].push({
                      name: file.name,
                      data: reader.result,
                      date: new Date().toISOString(),
                    });
                    resolve();
                  };
                  reader.readAsDataURL(file);
                });
              }
            }
            await saveFn(store);
            e.target.value = '';
            const label = snapForm.docType === 'bs' ? 'Bill Sheet' : 'PO';
            notify(
              `${files.length} ${label}(s) → ${vendors.length > 1 ? vendors.length + ' vendors' : vendors[0]}`
            );
            setSnapOpen(false);
            setSnapForm({ case_label: '', date: '', vendor: '', docType: 'bs' });
          }}
        />
      </div>
    </div>
  );
}
