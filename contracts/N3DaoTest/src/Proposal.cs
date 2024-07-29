using System;
using System.ComponentModel;
using System.Numerics;
using Neo;
using Neo.SmartContract.Framework;
// using Neo.SmartContract.Framework.Attributes;
using Neo.SmartContract.Framework.Native;
using Neo.SmartContract.Framework.Services;

#nullable enable

namespace AndroidTechnologies
{
    // --------------------- CONSTANTS --------------------

    public enum Vote {
        Null, // default value, counted as abstention
        Yes,
        No
    }

     /// <summary>
    /// This object is a summary of a Proposal details object.  It is used when
    ///  passing data back to client side calls for information on a 
    ///  particular Proposal.
    /// </summary>
    public class ProposalSummary
    {
        /// <summary>
        /// Constructor.
        /// </summary>
        /// <param name="proposalDetailsObj">A valid Proposal details object.</param>
        public ProposalSummary(ProposalDetails proposalDetailsObj)
        {
            if (proposalDetailsObj == null)
                throw new Exception($"({nameof(ProposalSummary)}) The Proposal details object is unassigned.");

            this.ID = proposalDetailsObj.ID;
            this.Details = proposalDetailsObj.Details;

            this.LootRequested = (int) proposalDetailsObj.LootRequested;
            this.SharesRequested = (int) proposalDetailsObj.SharesRequested;
            this.PaymentRequested = (int)proposalDetailsObj.PaymentRequested;
            this.TributeOffered = (int)proposalDetailsObj.TributeOffered;

            // foreach (var assetObj in proposalDetailsObj.AssetsList)
            //    this.listNeoFsIdPairs.Add(assetObj.ToIdPair());
            this.NeoFsCompoundIdPairs = proposalDetailsObj.NeoFsCompoundIdPairs;
        }

        public string ID = default!;

        public string Details = default!; // proposal details - could be IPFS hash, plaintext, or JSON
        public int LootRequested = default!; // the amount of loot the applicant is requesting
        public int PaymentRequested = default!; // the amount of payment tokens a non-DAO member is requesting.
        public int SharesRequested = default!; // the # of shares the applicant is requesting
        public int TributeOffered = default!; // amount of tokens offered as tribute
        // public List<string> listNeoFsIdPairs = new List<string>(); // The NeoFS URLs for all the assets associated with this proposal.
        public ByteString NeoFsCompoundIdPairs = default!; // The NeoFS assets for all the assets associated with this proposal in a comma delimited list of compound ID pairs.
    }
    
    /// <summary>
    /// This class holds the details for a proposal to the DAO.
    /// </summary>
    public class ProposalDetails
    {
        /// <summary>
        /// Constructor.
        /// </summary>
        public ProposalDetails()
        {

        }


        public string ID = default!; // ROS: GUID for proposal.  Created client side.
        public BigInteger SubmissionTime = BigInteger.Zero; // The date/time the proposal was submitted.

        public UInt160 Applicant = default!; // the applicant who wishes to become a member - this key will be used for withdrawals (doubles as guild kick target for gkick proposals)
        public UInt160 Proposer = default!; // the account that submitted the proposal (can be non-member).  ROS: We use the transaction sender.
        public UInt160 Sponsor = default!; // the member that sponsored the proposal (moving it into the queue)
        public BigInteger SharesRequested = BigInteger.Zero; // the # of shares the applicant is requesting
        public BigInteger LootRequested = BigInteger.Zero; // the amount of loot the applicant is requesting
        public BigInteger TributeOffered = BigInteger.Zero; // amount of tokens offered as tribute
        public UInt160 TributeToken = default!; // tribute token contract reference
        public BigInteger PaymentRequested = BigInteger.Zero; // amount of tokens requested as payment
        public UInt160 PaymentToken = default!; // payment token contract reference
        public BigInteger StartingPeriod = BigInteger.Zero; // the period in which voting can start for this proposal
        public BigInteger YesVotes = BigInteger.Zero; // the total number of YES votes for this proposal 
        public BigInteger NoVotes = BigInteger.Zero; // the total number of NO votes for this proposal
        public ProposalFlags Flags = new ProposalFlags(); // [sponsored, processed, didPass, cancelled, whitelist, guildkick]
        public string Details = default!; // proposal details - could be IPFS hash, plaintext, or JSON
        public BigInteger MaxTotalSharesAndLootAtYesVote = BigInteger.Zero; // the maximum # of total shares encountered at a yes vote on this proposal
        public Map<UInt160, Vote> VotesByMember = new Map<UInt160, Vote>(); // the votes on this proposal by each member
        // public List<AssetLocationNeoFS> AssetsList = new List<AssetLocationNeoFS>(); // The NeoFS URLs for all the assets associated with this proposal.
        public ByteString NeoFsCompoundIdPairs = default!; // A comma delimited list of NeoFS compound ID pairs, one for each asset associated with his proposal.

        /// <summary>
        /// Validates our content.  Throws an exception if any of our
        ///     fields are invalid, otherwise it just returns.
        /// </summary>
        /// <param name="callerName">The name of the calling function."</param>
        public void ValidateOrDie(string callerName)
        {
            if (MyUtilities.IsEmptyString(this.ID))
                throw new Exception($"({nameof(ValidateOrDie)}) The ID field is mepty.");
            if (0 == this.SubmissionTime)
                throw new Exception($"({nameof(ValidateOrDie)}) The SubmissionTime is 0.");
            // We don't validate the Applicant field as having a valid address because
            //  it is only given a value if this is a membership proposal.
            if (0 == this.SubmissionTime)
                throw new Exception($"({nameof(ValidateOrDie)}) The SubmissionTime is 0.");
            if (MyUtilities.IsEmptyOrInvalidUInt160(this.Proposer))
                throw new Exception($"({nameof(ValidateOrDie)}) The Proposer is empty.");

            // Only validate the sponsor field if this proposal has the status of "sponsored".
            if (this.Flags.IsSponsored && MyUtilities.IsEmptyOrInvalidUInt160(this.Sponsor))
                throw new Exception($"({nameof(ValidateOrDie)}) The proposal is marked as sponsored but the Sponsor field is empty.");
            if (0 > this.SharesRequested)
                throw new Exception($"({nameof(ValidateOrDie)}) The SharesRequested is negative.");
            if (0 > this.LootRequested)
                throw new Exception($"({nameof(ValidateOrDie)}) The LootRequested is negative.");
            if (0 > this.TributeOffered)
                throw new Exception($"({nameof(ValidateOrDie)}) The TributeOffered is negative.");
            if (this.TributeOffered > 0 && MyUtilities.IsEmptyOrInvalidUInt160( this.TributeToken))
                throw new Exception($"({nameof(ValidateOrDie)}) The TributeOffered is greater than 0 but the TributeToken is emptys.");
            if (0 > this.PaymentRequested)
                throw new Exception($"({nameof(ValidateOrDie)}) The PaymentRequested is negative.");
            if (this.PaymentRequested > 0 && MyUtilities.IsEmptyOrInvalidUInt160( this.PaymentToken))
                throw new Exception($"({nameof(ValidateOrDie)}) The PaymentRequested is greater than 0 but the PaymentToken is emptys.");
            if (0 > this.StartingPeriod)
                throw new Exception($"({nameof(ValidateOrDie)}) The StartingPeriod is negative.");
            if (0 > this.YesVotes)
                throw new Exception($"({nameof(ValidateOrDie)}) The YesVotes is negative.");
            if (0 > this.NoVotes)
                throw new Exception($"({nameof(ValidateOrDie)}) The NoVotes is negative.");
            if (null == this.Flags)                
                throw new Exception($"({nameof(ValidateOrDie)}) The Flags object is unassigned.");
            if ("" == this.Details)
                throw new Exception($"({nameof(ValidateOrDie)}) The Details field is empty.");
            if (0 > this.MaxTotalSharesAndLootAtYesVote)
                throw new Exception($"({nameof(ValidateOrDie)}) The MaxTotalSharesAndLootAtYesVote is negative.");
            if (null == this.VotesByMember)   
                throw new Exception($"({nameof(ValidateOrDie)}) The VotesByMenber object is unassigned.");
            // if (null == this.AssetsList)   
            //    throw new Exception($"({nameof(ValidateOrDie)}) The AssetsList object is unassigned.");
        }
    }
}