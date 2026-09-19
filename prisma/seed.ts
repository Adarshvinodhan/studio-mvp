import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_TERMS = `1. Booking & Payments
• Booking Deposit: A non-refundable deposit of 30% is required to secure the event date. No booking or date reservation is confirmed until this payment is received.
• Balance Payment: The 60% balance must be paid in full on or before the event date. Final deliverables will not be shared or released until the full payment has cleared.
• Remaining: 10% at deliverables (album designing stage). Album printing will proceed only after full payment.

2. Event Coverage & Timeline
• Team Allocation: The service will be executed by a professional crew member as detailed in the package breakdown above.
• Service Hours: The team will provide dedicated coverage for the agreed-upon duration of the event schedule.

3. Deliverables & Timeline
• The client will receive the raw file within 7 days.
• Only the client must select the images for the album and song for the highlight video.
• Delivery Schedule:
  o Final Edited Photos & Highlight Videos: Delivered within 30–45 working days post-event.
  o Full-Length Event Footage: Delivered within 30–45 working days post-event.

4. Revisions & Adjustments
• Creative Freedom: The service provider retains creative control over editing styles and colour grading.
• Revision Limit: The client is entitled to one round of minor revisions for the edited video and album. Major structural changes or subsequent rounds of edits will attract additional fees.

5. Backup Policy
• Data will be stored for 3 months from event date. Studio is not responsible for data loss after this period.

6. Copyright & Usage Rights
• Ownership: The service provider retains the copyright ownership of all captured imagery and video footage.
• Promotional Use: The service provider reserves the right to use selected photos and video clips for promotional purposes (such as portfolio displays, social media, and website showcases) unless explicitly restricted by the client in writing prior to the event date.`;

const premiumItems = [
  {
    name: "Traditional Photography",
    description:
      "Professional coverage of traditional Tamil rituals, Muhurtham, family portraits & stage moments.",
    category: "Photography",
    quantity: 1,
    unitPrice: 30000,
    sortOrder: 1,
  },
  {
    name: "Traditional Videography",
    description:
      "Complete traditional video coverage capturing full ceremonies with high-fidelity audio.",
    category: "Videography",
    quantity: 1,
    unitPrice: 25000,
    sortOrder: 2,
  },
  {
    name: "Candid Photography",
    description:
      "Artistic, story-driven natural moments captured by expert candid photographers.",
    category: "Photography",
    quantity: 1,
    unitPrice: 35000,
    sortOrder: 3,
  },
  {
    name: "Candid Videography",
    description:
      "Cinematic candid coverage focusing on emotional depths, vibrant colors & rituals.",
    category: "Videography",
    quantity: 1,
    unitPrice: 30000,
    sortOrder: 4,
  },
  {
    name: "Main Photo Album",
    description:
      "Exquisite designer premium wedding album (45 Sheets with lay-flat binding)",
    category: "Album",
    quantity: 2,
    unitPrice: 40000,
    sortOrder: 5,
  },
  {
    name: "4K Highlight Video",
    description: "Cinematic 4K wedding highlight film (5 to 7 Minutes of pure magic)",
    category: "Video",
    quantity: 1,
    unitPrice: 20000,
    sortOrder: 6,
  },
  {
    name: "Documentary Video",
    description: "Comprehensive extended event documentary edit (2 Hours complete coverage)",
    category: "Video",
    quantity: 1,
    unitPrice: 15000,
    sortOrder: 7,
  },
  {
    name: "Mini Albums",
    description: "Compact parent / family mini albums (20 Sheets each)",
    category: "Album",
    quantity: 2,
    unitPrice: 5000,
    sortOrder: 8,
  },
  {
    name: "Complementary Add-ons",
    description:
      "Custom Designer Frames (5 Nos) + Premium Desktop Calendars (2 Nos)",
    category: "Add-on",
    quantity: 1,
    unitPrice: 0,
    sortOrder: 9,
  },
];

async function main() {
  await prisma.businessSettings.deleteMany();
  await prisma.businessSettings.create({
    data: {
      businessName: "Camtrio Weddings",
      address:
        "Rajagopal Layout, Ilango Nagar, Avarampalayam, Coimbatore – 641 006",
      phone: "9597662916",
      email: "camtrioweddings@gmail.com",
      bankHolderName: "Sreenath",
      bankAccountNumber: "501005755077581",
      ifsc: "HDFC0000304",
      upiNumber: "95976 62916",
      defaultTerms: DEFAULT_TERMS,
      quotationPrefix: "CAM",
    },
  });

  const existingPremium = await prisma.package.findFirst({
    where: { name: "Premium Wedding Package" },
  });
  if (existingPremium) {
    await prisma.packageItem.deleteMany({ where: { packageId: existingPremium.id } });
    await prisma.package.delete({ where: { id: existingPremium.id } });
  }

  await prisma.package.create({
    data: {
      name: "Premium Wedding Package",
      description:
        "Camtrio Premium Traditional & Candid Wedding Package (All Inclusions Above)",
      basePrice: 200000,
      status: "ACTIVE",
      items: { create: premiumItems },
    },
  });

  const existingStandard = await prisma.package.findFirst({
    where: { name: "Standard Wedding Package" },
  });
  if (!existingStandard) {
    await prisma.package.create({
      data: {
        name: "Standard Wedding Package",
        description: "Camtrio Standard Wedding Package",
        basePrice: 150000,
        status: "ACTIVE",
        items: {
          create: premiumItems.slice(0, 6).map((item, i) => ({
            ...item,
            sortOrder: i + 1,
            unitPrice: item.unitPrice * 0.75,
          })),
        },
      },
    });
  }

  let customer = await prisma.customer.findFirst({ where: { name: "Pranesh" } });
  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        name: "Pranesh",
        phone: "9791265102",
        whatsapp: "9791265102",
        address: "Kalapatti, Coimbatore",
      },
    });
  }

  const eventExists = await prisma.event.findFirst({
    where: { customerId: customer.id, name: "Wedding Ceremony" },
  });
  if (!eventExists) {
    await prisma.event.create({
      data: {
        customerId: customer.id,
        name: "Wedding Ceremony",
        type: "Wedding",
        eventDate: new Date("2026-10-01"),
        location: "Coimbatore, TN",
      },
    });
  }

  console.log("Seed complete: Camtrio settings, packages, and sample customer.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
