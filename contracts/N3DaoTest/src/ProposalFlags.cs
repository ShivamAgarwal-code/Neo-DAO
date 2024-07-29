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

    /// <summary>
    /// This class holds the flag settings for a Proposal.
    /// </summary>
    public class ProposalFlags
    {
        /// <summary>
        /// Constructor.
        /// </summary>
        public ProposalFlags()
        {

        }

        public bool IsSponsored = default!;
        public bool IsProcessed = default!;
        public bool IsDidPass = default!;
        public bool IsCancelled = default!;
        public bool IsWhitelist = default!;
        public bool IsGuildKick = default!;
    }
}
