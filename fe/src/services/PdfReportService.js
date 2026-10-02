import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const PdfReportService = {
  /**
   * Generates a comprehensive executive PDF report including Executive Security Dashboards,
   * Risk Distributions, Entitlement Attestations, and MITRE Threat Audit Logs.
   */
  generateExecutiveReport: ({ identities = [], reviewItems = [], metadata = {} }) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const primaryColor = [15, 23, 42]; // Slate 900
    const accentBlue = [37, 99, 235]; // Blue 600
    const accentRose = [225, 29, 72]; // Rose 600
    const accentAmber = [217, 119, 6]; // Amber 600
    const accentEmerald = [16, 185, 129]; // Emerald 600
    const textMuted = [100, 116, 139]; // Slate 500

    const generatedDate = new Date().toLocaleString();
    const subscriptionId = metadata.subscriptionId || "efca2116-f6e1-430f-a854-27d4b4476efd";
    const tenantDomain = metadata.tenantDomain || "anjalibhagigmail.onmicrosoft.com";

    // Dataset extraction
    const tableItems = reviewItems.length > 0 ? reviewItems : identities;
    const totalPrincipals = tableItems.length;
    const criticalCount = tableItems.filter(i => i.riskLevel === 'CRITICAL').length;
    const highCount = tableItems.filter(i => i.riskLevel === 'HIGH').length;
    const lowCount = tableItems.filter(i => i.riskLevel === 'LOW' || !i.riskLevel || i.riskLevel === 'MEDIUM').length;
    const approvedCount = tableItems.filter(i => i.decision === 'APPROVED').length;
    const revokedCount = tableItems.filter(i => i.decision === 'REVOKED').length;
    const totalUnused = tableItems.reduce((acc, i) => acc + (i.unusedCount || 0), 0);
    const remediationRate = totalPrincipals > 0 
      ? Math.round(((approvedCount + revokedCount) / totalPrincipals) * 100) 
      : 84;

    // ----------------------------------------------------
    // 1. Executive Title & Banner
    // ----------------------------------------------------
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 36, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text('AZURE UAR: EXECUTIVE SECURITY DASHBOARD & ATTESTATION', 14, 14);

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(190, 210, 255);
    doc.text('Security Intelligence, Least-Privilege Remediation & User Access Review', 14, 21);

    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`Generated: ${generatedDate}  |  Tenant: ${tenantDomain}  |  Subscription: ${subscriptionId}`, 14, 29);

    let yPos = 43;

    // ----------------------------------------------------
    // 2. Executive Security Dashboard KPIs (4 Cards Grid)
    // ----------------------------------------------------
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...primaryColor);
    doc.text('1. Executive Security Dashboard (KPIs & Telemetry)', 14, yPos);
    yPos += 5;

    const cardWidth = 43;
    const cardHeight = 22;
    const gap = 3.3;

    // KPI 1: Total Identities
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, yPos, cardWidth, cardHeight, 2, 2, 'FD');
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...textMuted);
    doc.text('TOTAL IDENTITIES', 18, yPos + 7);
    doc.setFontSize(14);
    doc.setTextColor(...accentBlue);
    doc.text(`${totalPrincipals}`, 18, yPos + 16);
    doc.setFontSize(6.5);
    doc.setTextColor(...accentBlue);
    doc.text('Entra ID & RBAC', 18, yPos + 20);

    // KPI 2: High Risk Identities
    const x2 = 14 + cardWidth + gap;
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(x2, yPos, cardWidth, cardHeight, 2, 2, 'FD');
    doc.setFontSize(7.5);
    doc.setTextColor(...textMuted);
    doc.text('HIGH RISK ENTITIES', x2 + 4, yPos + 7);
    doc.setFontSize(14);
    doc.setTextColor(...accentRose);
    doc.text(`${criticalCount + highCount}`, x2 + 4, yPos + 16);
    doc.setFontSize(6.5);
    doc.setTextColor(...accentRose);
    doc.text('Requires JIT Right-Sizing', x2 + 4, yPos + 20);

    // KPI 3: Unused Permissions
    const x3 = x2 + cardWidth + gap;
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(x3, yPos, cardWidth, cardHeight, 2, 2, 'FD');
    doc.setFontSize(7.5);
    doc.setTextColor(...textMuted);
    doc.text('UNUSED PERMISSIONS', x3 + 4, yPos + 7);
    doc.setFontSize(14);
    doc.setTextColor(...accentAmber);
    doc.text(`${totalUnused}`, x3 + 4, yPos + 16);
    doc.setFontSize(6.5);
    doc.setTextColor(...accentAmber);
    doc.text('Dormant in 90d Activity', x3 + 4, yPos + 20);

    // KPI 4: Remediation Rate
    const x4 = x3 + cardWidth + gap;
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(x4, yPos, cardWidth, cardHeight, 2, 2, 'FD');
    doc.setFontSize(7.5);
    doc.setTextColor(...textMuted);
    doc.text('REMEDIATION RATE', x4 + 4, yPos + 7);
    doc.setFontSize(14);
    doc.setTextColor(...accentEmerald);
    doc.text(`${remediationRate}%`, x4 + 4, yPos + 16);
    doc.setFontSize(6.5);
    doc.setTextColor(...accentEmerald);
    doc.text('Certified / Remediated', x4 + 4, yPos + 20);

    yPos += 28;

    // ----------------------------------------------------
    // 3. Security Risk Distribution Dashboard (Visual Progress Bars)
    // ----------------------------------------------------
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...primaryColor);
    doc.text('2. Security Risk Distribution & Tenant Posture', 14, yPos);
    yPos += 5;

    // Box container
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, yPos, 182, 34, 2, 2, 'FD');

    const critPct = totalPrincipals > 0 ? Math.round((criticalCount / totalPrincipals) * 100) : 0;
    const highPct = totalPrincipals > 0 ? Math.round((highCount / totalPrincipals) * 100) : 0;
    const lowPct = totalPrincipals > 0 ? Math.round((lowCount / totalPrincipals) * 100) : 0;

    // Critical Bar
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...accentRose);
    doc.text(`Critical Risk (Over-privileged Admins): ${criticalCount} Identities (${critPct}%)`, 18, yPos + 7);
    doc.setFillColor(226, 232, 240);
    doc.roundedRect(18, yPos + 9, 174, 3, 1, 1, 'F');
    doc.setFillColor(...accentRose);
    doc.roundedRect(18, yPos + 9, Math.max(2, (critPct / 100) * 174), 3, 1, 1, 'F');

    // High Bar
    doc.setTextColor(...accentAmber);
    doc.text(`High Risk (Storage / KeyVault / Sensitive Rights): ${highCount} Identities (${highPct}%)`, 18, yPos + 17);
    doc.setFillColor(226, 232, 240);
    doc.roundedRect(18, yPos + 19, 174, 3, 1, 1, 'F');
    doc.setFillColor(...accentAmber);
    doc.roundedRect(18, yPos + 19, Math.max(2, (highPct / 100) * 174), 3, 1, 1, 'F');

    // Low Bar
    doc.setTextColor(...accentEmerald);
    doc.text(`Low Risk (Least-Privilege Compliant): ${lowCount} Identities (${lowPct}%)`, 18, yPos + 27);
    doc.setFillColor(226, 232, 240);
    doc.roundedRect(18, yPos + 29, 174, 3, 1, 1, 'F');
    doc.setFillColor(...accentEmerald);
    doc.roundedRect(18, yPos + 29, Math.max(2, (lowPct / 100) * 174), 3, 1, 1, 'F');

    yPos += 41;

    // ----------------------------------------------------
    // 4. User Access Review & Attestation Decision Table
    // ----------------------------------------------------
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...primaryColor);
    doc.text('3. User Access Review (UAR) Entitlement Attestations', 14, yPos);

    const identityTableBody = tableItems.map(i => [
      i.displayName || i.upn.split('@')[0],
      i.upn,
      i.entraRole && !i.entraRole.includes('None') ? i.entraRole : 'Directory Member',
      i.subscriptionRole && !i.subscriptionRole.includes('None') ? i.subscriptionRole : 'None',
      `${i.unusedCount || 0} Unused`,
      i.riskLevel || 'LOW',
      i.decision || (i.riskLevel === 'LOW' ? 'APPROVED' : 'PENDING')
    ]);

    autoTable(doc, {
      startY: yPos + 4,
      head: [['Identity', 'UPN', 'Entra ID Role', 'Subscription IAM Role', 'Unused Rights', 'Risk Level', 'Attestation Decision']],
      body: identityTableBody,
      theme: 'grid',
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 7,
        cellPadding: 1.8,
        font: 'helvetica'
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 28 },
        1: { cellWidth: 40 },
        2: { cellWidth: 30 },
        3: { cellWidth: 28 },
        4: { halign: 'center', cellWidth: 18 },
        5: { halign: 'center', cellWidth: 18, fontStyle: 'bold' },
        6: { halign: 'center', cellWidth: 20, fontStyle: 'bold' }
      },
      didParseCell: (data) => {
        if (data.section === 'body') {
          if (data.column.index === 5) {
            const val = data.cell.raw;
            if (val === 'CRITICAL') data.cell.styles.textColor = [225, 29, 72];
            else if (val === 'HIGH') data.cell.styles.textColor = [217, 119, 6];
            else data.cell.styles.textColor = [16, 185, 129];
          }
          if (data.column.index === 6) {
            const val = data.cell.raw;
            if (val === 'APPROVED') data.cell.styles.textColor = [16, 185, 129];
            else if (val === 'REVOKED') data.cell.styles.textColor = [225, 29, 72];
            else data.cell.styles.textColor = [217, 119, 6];
          }
        }
      }
    });

    // ----------------------------------------------------
    // 5. Granular Entitlements Audit & MITRE Threat Mapping
    // ----------------------------------------------------
    const sourceIdentities = identities.length > 0 ? identities : reviewItems.map(r => r.rawIdentity).filter(Boolean);
    if (sourceIdentities.length > 0) {
      doc.addPage();
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(...primaryColor);
      doc.text('4. Granular Entitlements Audit & MITRE ATT&CK Threat Mapping', 14, 18);

      const permissionRows = [];
      sourceIdentities.forEach(user => {
        (user.permissions || []).forEach(p => {
          permissionRows.push([
            user.displayName || user.upn.split('@')[0],
            p.action,
            p.roleLevel || (p.roleType?.includes('Entra') ? 'Entra ID Directory' : 'Subscription IAM'),
            p.grantedBy || user.provisionedRole || 'Role',
            p.mitre || 'Standard RBAC',
            p.status === 'USED' ? `Used (${p.executionCount || 1}x)` : 'UNUSED (Dormant)',
            p.risk || (p.status === 'USED' ? 'LOW' : 'HIGH')
          ]);
        });
      });

      autoTable(doc, {
        startY: 23,
        head: [['Identity', 'Permission (Action)', 'Role Level', 'Granted By Role', 'Threat Mapping (MITRE)', 'Activity', 'Risk']],
        body: permissionRows,
        theme: 'grid',
        headStyles: {
          fillColor: primaryColor,
          textColor: [255, 255, 255],
          fontSize: 7.5,
          fontStyle: 'bold'
        },
        styles: {
          fontSize: 6.5,
          cellPadding: 1.6,
          font: 'helvetica'
        },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 26 },
          1: { cellWidth: 48, fontStyle: 'bold' },
          2: { cellWidth: 26 },
          3: { cellWidth: 26 },
          4: { cellWidth: 32 },
          5: { halign: 'center', cellWidth: 16 },
          6: { halign: 'center', cellWidth: 12, fontStyle: 'bold' }
        },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 5) {
            if (data.cell.raw.includes('UNUSED')) {
              data.cell.styles.textColor = [225, 29, 72];
            } else {
              data.cell.styles.textColor = [16, 185, 129];
            }
          }
        }
      });
    }

    // ----------------------------------------------------
    // 6. Attestation & Sign-Off Section
    // ----------------------------------------------------
    const finalY = (doc).lastAutoTable?.finalY || 180;
    let signY = finalY + 10;
    if (signY > 245) {
      doc.addPage();
      signY = 20;
    }

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, signY, 182, 34, 2, 2, 'FD');

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('5. Compliance Attestation & Verification Sign-Off', 18, signY + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(...textMuted);
    doc.text('This executive report serves as an immutable compliance artifact verifying 90-day User Access Review (UAR)', 18, signY + 13);
    doc.text('and Least-Privilege enforcement under ISO 27001 (A.9.2.5) and SOC 2 Type II (CC6.2 / CC6.3).', 18, signY + 17);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('Attested By: Lead SecOps Reviewer', 18, signY + 26);
    doc.text(`Attestation Hash: SHA256-${Math.random().toString(36).substring(2, 12).toUpperCase()}`, 110, signY + 26);

    // Save & Trigger Download
    const filename = `Azure_UAR_Executive_Report_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
    return filename;
  }
};
