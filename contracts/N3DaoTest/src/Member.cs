using System;
using System.ComponentModel;
using System.Numerics;
using Neo;
using Neo.SmartContract.Framework;
// using Neo.SmartContract.Framework.Attributes;
using Neo.SmartContract.Framework.Native;
using Neo.SmartContract.Framework.Services;

/**
    NOTE: This file contains an object for storing details about DAO members.
*/


#nullable enable

namespace AndroidTechnologies
{
    // --------------------- CONSTANTS --------------------


    public class MemberDetails
    {
        /// <summary>
        /// Constructor.
        /// </summary>
        /// <param name="delegateKey">The delegate for this member.  Default is the member's own addresss.</param>
        /// <param name="exists">TRUE if the member exists, FALSE if not.</param>
        /// <param name="highestIndexYesVote">Highest proposal index # on which the member votes YES</param>
        /// <param name="jailed">set to proposalIndex of a passing guild kick proposal for this member, prevents voting on and sponsoring proposals</param>
        /// <param name="loot">the loot amount available to this member (combined with shares on ragequit)</param>
        /// <param name="shares">the # of voting shares assigned to this member</param>
        public MemberDetails(UInt160 delegateKey, bool exists, BigInteger highestIndexYesVote, bool jailed, BigInteger loot, BigInteger shares)
        {
            this.delegateKey = delegateKey;
            this.exists = exists;
            this.highestIndexYesVote = highestIndexYesVote;
            this.isJailed = jailed;
            this.loot = loot;
            this.shares = shares;
        }

        public UInt160 delegateKey = default!; // the key responsible for submitting proposals and voting - defaults to member public UInt160 unless updated
        public bool exists = default!; // always true once a member has been created
        public BigInteger highestIndexYesVote = BigInteger.Zero; // highest proposal index # on which the member voted YES
        public bool isJailed = default!; // set to proposalIndex of a passing guild kick proposal for this member, prevents voting on and sponsoring proposals
        public BigInteger loot = BigInteger.Zero; // the loot amount available to this member (combined with shares on ragequit)
        public BigInteger shares = BigInteger.Zero; // the # of voting shares assigned to this member
    }
} 